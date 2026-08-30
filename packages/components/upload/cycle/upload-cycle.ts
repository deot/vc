import { UploadTaskContext } from '../task/context';
import type { UploadResolvedProps } from '../upload-props';
import type { UploadCycleResult, UploadFeedback } from '../types';
import { UploadCycleLeaf } from './upload-cycle-leaf';
import type {
	UploadCycleOptions,
	UploadCycleParent,
	UploadLifecycleEventArgs
} from './types';

/**
 * Upload 组件级的周期容器。
 * 负责管理重叠上传 Leaf，并统一协调 Vue 事件与 UploadTask 的派发顺序。
 */
export class UploadCycle {
	/**
	 * 当前仍在上传或等待结算的周期。
	 */
	readonly leafs = new Set<UploadCycleLeaf>();

	/**
	 * 指向最近创建且仍然存活的 Leaf。
	 */
	current?: UploadCycleLeaf;

	/**
	 * 仅保留 setup 上下文提供的父级通信能力。
	 */
	private readonly parent: UploadCycleParent;

	/**
	 * 跨 Leaf 汇总任务状态，并按 showTask 控制共享浮层。
	 */
	private readonly task: UploadTaskContext;

	private destroyed = false;

	private settlementDepth = 0;

	private destroyPending = false;

	constructor(
		private readonly props: Readonly<UploadResolvedProps>,
		{ emit }: UploadCycleParent,
		private readonly feedback: UploadFeedback
	) {
		this.parent = { emit };
		this.task = new UploadTaskContext(() => this.props.showTask);
	}

	/**
	 * 创建独立上传周期，并在创建时固定 parallel 与 Loading 实例。
	 * @param options - 当前上传周期的文件信息。
	 * @param options.rawFiles - 用户选择的原始文件列表。
	 * @param options.files - 添加周期标识后的文件列表。
	 * @returns 新创建的 Leaf；容器销毁后返回 undefined。
	 */
	create(options: UploadCycleOptions) {
		if (this.destroyed) return;

		const leaf = new UploadCycleLeaf(this, {
			...options,
			parallel: this.props.parallel,
			loadingInstance: this.props.showLoading
				? this.feedback.loading('上传中...')
				: undefined
		});
		this.leafs.add(leaf);
		this.current = leaf;
		return leaf;
	}

	/**
	 * canceled 或已脱离容器的 Leaf 不再允许派发任何事件。
	 * @param leaf - 需要检查的上传周期。
	 * @returns Leaf 当前是否仍由容器管理。
	 */
	has(leaf: UploadCycleLeaf) {
		return !this.destroyed && this.leafs.has(leaf) && !leaf.canceled;
	}

	/**
	 * 终态事件和单文件 done 必须作为一个不可中断的结算事务执行。
	 * @param leaf - 当前结算的上传周期。
	 * @param settle - 派发终态事件并完成文件结算的操作。
	 */
	settle(leaf: UploadCycleLeaf, settle: () => void) {
		if (!this.has(leaf)) return;

		this.settlementDepth++;
		try {
			settle();
		} finally {
			this.settlementDepth--;
			if (this.settlementDepth === 0 && this.destroyPending) {
				this.destroyImmediately();
			}
		}
	}

	/**
	 * 卸载已在等待时不再启动串行队列的下一项。
	 * @param leaf - 准备继续调度的上传周期。
	 * @returns 当前周期是否仍允许启动新文件。
	 */
	canContinue(leaf: UploadCycleLeaf) {
		return this.has(leaf) && !this.destroyPending;
	}

	/**
	 * 外部事件可能同步卸载 Upload，因此每次派发后都需要重新确认 Leaf 是否有效。
	 * begin 先更新 UploadTask，file-start 先通知外部；进度与结算事件先更新 UploadTask。
	 * @param leaf - 产生事件的上传周期。
	 * @param event - 需要派发的事件及其参数。
	 */
	dispatch(leaf: UploadCycleLeaf, ...event: UploadLifecycleEventArgs) {
		if (!this.has(leaf)) return;

		const [eventName, payload] = event;
		switch (eventName) {
			case 'begin': {
				/*
				 * Task 先读取唯一的边界快照，再将同一对象交给外部回调。
				 * 外部修改不会污染 Task 或当前 Leaf 的固定调度集合。
				 */
				const stablePayload = {
					rawFiles: [...payload.rawFiles],
					files: payload.files.map(file => ({ ...file }))
				};
				this.task.emit('begin', stablePayload);
				if (this.has(leaf)) {
					this.parent.emit('begin', stablePayload);
				}
				break;
			}
			case 'file-start': {
				this.parent.emit('file-start', payload);
				if (this.has(leaf)) {
					this.task.emit('file-start', {
						...payload,
						file: leaf.restoreIdentity(payload.file)
					});
				}
				break;
			}
			case 'file-progress': {
				const file = leaf.restoreIdentity(payload.file);
				const stablePayload = { ...payload, file };
				this.task.emit('file-progress', stablePayload);
				if (this.has(leaf)) {
					this.parent.emit('file-progress', stablePayload);
				}
				break;
			}
			case 'file-success': {
				const file = leaf.restoreIdentity(payload.file);
				const stablePayload = { ...payload, file };
				this.task.emit('file-success', stablePayload);
				if (this.has(leaf)) {
					this.parent.emit('file-success', stablePayload);
				}
				break;
			}
			case 'file-error': {
				const file = leaf.restoreIdentity(payload.file);
				const stablePayload = { ...payload, file };
				this.task.emit('file-error', stablePayload);
				if (this.has(leaf) && payload.stage === 'upload') {
					this.parent.emit('file-error', stablePayload);
				}
				break;
			}
			case 'complete':
				this.completeLeaf(leaf, payload.result);
				break;
		}
	}

	/**
	 * 移除 Leaf 时同时关闭该周期创建的 Loading。
	 * @param leaf - 需要移除的上传周期。
	 */
	remove(leaf: UploadCycleLeaf) {
		leaf.destroyLoading();
		this.leafs.delete(leaf);
		if (this.current === leaf) {
			const leafs = [...this.leafs];
			this.current = leafs[leafs.length - 1];
		}
	}

	/**
	 * Upload 卸载时取消所有请求并释放共享任务浮层的 owner。
	 */
	destroy() {
		if (this.destroyed || this.destroyPending) return;
		if (this.settlementDepth > 0) {
			/*
			 * 终态回调可能同步触发组件卸载，当前文件仍需完成本地结算。
			 */
			this.destroyPending = true;
			return;
		}

		this.destroyImmediately();
	}

	private destroyImmediately() {
		if (this.destroyed) return;

		this.destroyed = true;
		this.destroyPending = false;
		[...this.leafs].forEach(leaf => leaf.cancel());
		this.leafs.clear();
		this.current = undefined;
		this.task.destroy();
	}

	private completeLeaf(leaf: UploadCycleLeaf, result: UploadCycleResult) {
		this.remove(leaf);
		/*
		 * complete 回调可能同步卸载组件，因此任务结算前需要再次检查 destroyed。
		 */
		const payload = { result };
		this.parent.emit('complete', payload);

		if (!this.destroyed) {
			this.task.emit('complete', payload);
		}
	}
}
