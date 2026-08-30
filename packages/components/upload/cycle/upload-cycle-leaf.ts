import type { UploadCycleResult, UploadFile } from '../types';
import type { UploadCycle } from './upload-cycle';
import type {
	UploadCycleLeafOptions,
	UploadLifecycleEventArgs,
	UploadRequestHandle
} from './types';
import { normalizeProcessedFile } from './utils';

/**
 * 一次文件选择对应一个 Leaf，负责该批文件的调度、请求取消与结果结算。
 * 同一个 UploadCycle 可以同时持有多个 Leaf，以支持重叠上传周期。
 */
export class UploadCycleLeaf {
	/**
	 * 周期状态由事件主动同步给外部和 UploadTask，无需使用 Vue reactive。
	 */
	private readonly states: UploadCycleResult;

	private readonly files: UploadFile[];

	/**
	 * Hook 可以原地修改 UploadFile，因此在调用前保存不可变的源文件快照。
	 */
	private readonly sourceFiles = new WeakMap<object, UploadFile>();

	private readonly requests = new Map<string, UploadRequestHandle>();

	/**
	 * 已完成结算，后续回调需要直接忽略。
	 */
	private readonly completedUploadIds = new Set<string>();

	/**
	 * 已抢占结算权但异步响应转换尚未完成，用于拦截 XHR 的重复终态回调。
	 */
	private readonly settlingUploadIds = new Set<string>();

	private readonly parallel: boolean;

	private loadingInstance?: UploadCycleLeafOptions['loadingInstance'];

	private started = false;

	canceled = false;

	finished = false;

	readonly rawFiles: File[];

	constructor(
		private readonly owner: UploadCycle,
		options: UploadCycleLeafOptions
	) {
		this.rawFiles = options.rawFiles;
		this.files = options.files;
		options.files.forEach(file => this.sourceFiles.set(file, { ...file }));
		this.states = {
			total: options.files.length,
			completed: 0,
			succeeded: 0,
			failed: 0,
			responses: [],
			queues: []
		};
		this.parallel = options.parallel;
		this.loadingInstance = options.loadingInstance;
	}

	/**
	 * 统一由所属 UploadCycle 决定 Vue 事件和 UploadTask 的派发顺序。
	 * @param event - 需要派发的事件名与对象参数。
	 */
	emit(...event: UploadLifecycleEventArgs) {
		this.owner.dispatch(this, ...event);
	}

	/**
	 * 规范化 onFileBefore 的返回值，并始终保留源文件的周期标识。
	 * @param source - 当前周期创建的源文件信息。
	 * @param processedFile - onFileBefore 返回的处理结果。
	 * @returns 规范化后的文件；返回 undefined 表示该文件已取消。
	 */
	processFile(source: UploadFile, processedFile: unknown) {
		const index = this.files.indexOf(source);
		const sourceFile = this.sourceFiles.get(source);
		if (index < 0 || !sourceFile) {
			throw new Error(`未找到上传文件：${source.uploadId}`);
		}

		const processedObject = processedFile && typeof processedFile === 'object'
			? processedFile
			: undefined;
		const processedSource = processedObject
			? this.sourceFiles.get(processedObject)
			: undefined;
		const isolatedFile = processedSource && processedSource.uploadId !== sourceFile.uploadId
			? { ...processedObject }
			: processedFile;
		const file = normalizeProcessedFile(source, isolatedFile, sourceFile);
		if (file === false) {
			this.finishPreflightError(source, '上传已取消');
			return;
		}

		this.files[index] = file;
		this.sourceFiles.set(file, sourceFile);
		return file;
	}

	/**
	 * 前置处理失败没有外部 file-error 事件，只结算周期并更新 UploadTask。
	 * @param file - 前置处理失败的文件。
	 * @param message - 任务浮层展示的失败原因。
	 * @param cause - onFileBefore 返回 false 或抛出的原始原因。
	 */
	finishPreflightError(file: UploadFile, message: string, cause: unknown = false) {
		const sourceFile = this.sourceFiles.get(file) || file;
		if (sourceFile !== file) {
			const index = this.files.indexOf(file);
			if (index >= 0) this.files[index] = sourceFile;
		}
		if (!this.claimSettlement(sourceFile)) return;

		this.recordFailure();
		this.emit('file-error', {
			stage: 'preflight',
			cause,
			file: sourceFile,
			message,
			result: this.snapshot()
		});
		this.done(sourceFile);
	}

	/**
	 * 队列只能在周期开始前设置，防止运行时重复调度。
	 * @param queues - 当前周期的文件上传函数。
	 */
	setQueues(queues: UploadCycleResult['queues']) {
		if (this.started || this.canceled || this.finished) return;

		/*
		 * queues 属于公开结果的一部分，因此每个调度函数自身也必须是 one-shot。
		 * 回调重复执行快照中的函数时，不得再次进入前置处理或创建重复请求。
		 */
		this.states.queues = queues.map((run) => {
			let started = false;

			return () => {
				if (started || this.canceled || this.finished) return;

				started = true;
				run();
			};
		});
	}

	/**
	 * 使用创建 Leaf 时捕获的 parallel，确保运行中修改 props 不影响当前周期。
	 */
	start() {
		if (this.started || this.canceled || this.finished) return;

		this.started = true;
		if (this.parallel) {
			for (const run of this.states.queues) {
				if (this.canceled || this.finished) break;
				run();
			}
		} else {
			this.states.queues.shift()?.();
		}
	}

	registerRequest(file: UploadFile, request: UploadRequestHandle) {
		if (this.canceled || this.finished) return false;

		this.requests.set(this.getUploadId(file), request);
		return true;
	}

	/**
	 * 抢占文件的唯一结算权；成功、失败、超时等终态回调只有一个可以继续执行。
	 * @param file - 需要结算的上传文件。
	 * @returns 是否成功取得结算权。
	 */
	claimSettlement(file: UploadFile) {
		const uploadId = this.getUploadId(file);
		if (
			this.canceled
			|| this.finished
			|| this.completedUploadIds.has(uploadId)
			|| this.settlingUploadIds.has(uploadId)
		) return false;

		this.settlingUploadIds.add(uploadId);
		this.requests.delete(uploadId);
		return true;
	}

	success(file: UploadFile, response: unknown) {
		const uploadId = this.getUploadId(file);
		if (this.canceled || !this.settlingUploadIds.has(uploadId)) return;

		this.owner.settle(this, () => {
			const settledFile = this.restoreIdentity(file);
			this.states.succeeded++;
			this.states.completed++;
			this.states.responses = [...this.states.responses, response];
			try {
				this.emit('file-success', {
					response,
					file: settledFile,
					result: this.snapshot()
				});
			} finally {
				this.done(settledFile);
			}
		});
	}

	error(file: UploadFile, cause: unknown, message: string) {
		const uploadId = this.getUploadId(file);
		if (this.canceled || !this.settlingUploadIds.has(uploadId)) return;

		this.owner.settle(this, () => {
			const settledFile = this.restoreIdentity(file);
			this.recordFailure();
			try {
				this.emit('file-error', {
					stage: 'upload',
					cause,
					file: settledFile,
					result: this.snapshot(),
					message
				});
			} finally {
				this.done(settledFile);
			}
		});
	}

	/**
	 * 完成单个文件结算；串行模式在此启动下一项，全部完成后结束当前 Leaf。
	 * @param file - 已完成成功或失败结算的文件。
	 */
	private done(file: UploadFile) {
		const uploadId = this.getUploadId(file);
		if (
			this.canceled
			|| this.finished
			|| this.completedUploadIds.has(uploadId)
		) return;

		this.settlingUploadIds.delete(uploadId);
		this.completedUploadIds.add(uploadId);
		if (!this.parallel && this.owner.canContinue(this)) {
			this.states.queues.shift()?.();
		}

		if (this.states.completed !== this.states.total) return;

		this.finished = true;
		this.emit('complete', {
			result: this.snapshot()
		});
	}

	/**
	 * 判断文件是否已进入或完成结算，避免继续派发进度。
	 * @param file - 需要检查的上传文件。
	 * @returns 是否应忽略后续进度或终态回调。
	 */
	isSettled(file: UploadFile) {
		const uploadId = this.getUploadId(file);
		return this.canceled
			|| this.finished
			|| this.completedUploadIds.has(uploadId)
			|| this.settlingUploadIds.has(uploadId);
	}

	destroyLoading() {
		this.loadingInstance?.destroy();
		this.loadingInstance = undefined;
	}

	/**
	 * 取消仍在请求中的文件，并从所属 UploadCycle 移除当前 Leaf。
	 */
	cancel() {
		if (this.canceled) return;

		this.canceled = true;
		const requests = [...this.requests.values()];
		this.requests.clear();
		requests.forEach(request => request.cancel());
		this.owner.remove(this);
	}

	private recordFailure() {
		this.states.failed++;
		this.states.completed++;
	}

	/**
	 * 外部事件可以修改文件对象，内部结算始终使用 Cycle 创建时的标识。
	 * @param file - 需要恢复标识的上传文件。
	 * @returns 标识已恢复的原对象或副本。
	 */
	restoreIdentity(file: UploadFile) {
		const source = this.sourceFiles.get(file);
		if (!source) return file;

		if (
			file.uploadId === source.uploadId
			&& file.current === source.current
			&& file.total === source.total
		) return file;

		if (Object.isExtensible(file)) {
			file.uploadId = source.uploadId;
			file.current = source.current;
			file.total = source.total;
			return file;
		}

		const restored = {
			...file,
			uploadId: source.uploadId,
			current: source.current,
			total: source.total
		};
		this.sourceFiles.set(restored, source);
		const index = this.files.indexOf(file);
		if (index >= 0) this.files[index] = restored;
		return restored;
	}

	private getUploadId(file: UploadFile) {
		return this.sourceFiles.get(file)?.uploadId ?? file.uploadId;
	}

	private snapshot(): UploadCycleResult {
		/*
		 * 事件使用独立对象和数组，避免回调修改调度队列或污染后续结果。
		 */
		return {
			...this.states,
			responses: [...this.states.responses],
			queues: [...this.states.queues]
		};
	}
}
