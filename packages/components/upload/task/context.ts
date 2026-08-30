import { onScopeDispose, watch } from 'vue';
import { Portal } from '../../portal';
import type { UploadLifecycleEventArgs } from '../cycle/types';
import type { UploadFile } from '../types';
import type {
	UploadTaskItem,
	UploadTaskLeaf,
	UploadTaskStatus
} from './types';
import { UploadTask } from './task';
import { isTaskActive, isTaskListSettled, isTaskSettled } from './utils';

/**
 * 汇总同一个 Upload 组件产生的所有周期，并将状态同步到共享任务浮层。
 */
export class UploadTaskContext {
	private enabled: boolean;

	private destroyed = false;

	private leaf?: UploadTaskLeaf;

	private readonly tasks = new Map<string, UploadTaskItem>();

	/**
	 * 创建组件级任务上下文，并跟随 showTask 的响应式值获取或释放浮层。
	 * @param getEnabled - 获取当前 showTask 配置。
	 */
	constructor(getEnabled: () => boolean) {
		this.enabled = getEnabled();
		watch(getEnabled, enabled => this.setEnabled(enabled));
		onScopeDispose(() => this.destroy());
	}

	private setEnabled(enabled: boolean) {
		if (this.destroyed || this.enabled === enabled) return;

		this.enabled = enabled;
		if (enabled) {
			this.acquireLeaf(true);
		} else {
			this.detach();
		}
	}

	/**
	 * 接收 UploadCycle 的事件名与对象参数，并保持两者的类型关联。
	 * @param event - 当前 Leaf 的事件名与对象参数。
	 */
	emit(...event: UploadLifecycleEventArgs) {
		if (this.destroyed) return;

		const [eventName, payload] = event;
		switch (eventName) {
			case 'begin':
				this.show(payload.files);
				break;
			case 'file-start':
				this.update(payload.file);
				this.start(payload.file.uploadId);
				break;
			case 'file-progress':
				this.progress(payload.file.uploadId, payload.progress.percent);
				break;
			case 'file-success':
				this.success(payload.file.uploadId);
				break;
			case 'file-error':
				this.error(payload.file.uploadId, payload.message || '上传失败');
				break;
			case 'complete':
				this.complete();
				break;
		}
	}

	/**
	 * 组件卸载后移除自身任务，并丢弃不再需要恢复的本地状态。
	 */
	destroy() {
		if (this.destroyed) return;

		this.destroyed = true;
		this.detach();
		this.tasks.clear();
	}

	private show(files: UploadFile[]) {
		const previousIds = [...this.tasks.keys()];
		const hasActiveTask = [...this.tasks.values()]
			.some(task => isTaskActive(task.status));
		if (!hasActiveTask) {
			/*
			 * Context 只移除自身旧结果，不能清空其他 Upload 的共享任务。
			 */
			this.getCurrentLeaf()?.wrapper?.remove(previousIds);
			this.tasks.clear();
		}

		files.forEach((file) => {
			this.tasks.set(file.uploadId, {
				uploadId: file.uploadId,
				name: file.name,
				size: file.size,
				percent: file.percent,
				status: 'pending',
				message: ''
			});
		});
		this.acquireLeaf(true);
	}

	private update(file: UploadFile) {
		const task = this.tasks.get(file.uploadId);
		if (!task) return;

		task.name = file.name;
		task.size = file.size;
		task.percent = file.percent;
		this.acquireLeaf()?.wrapper?.update(task);
	}

	private start(uploadId: string) {
		if (!this.setStatus(uploadId, 'uploading')) return;

		this.acquireLeaf()?.wrapper?.start(uploadId);
	}

	private progress(uploadId: string, percent: number) {
		const task = this.tasks.get(uploadId);
		if (!task || isTaskSettled(task.status)) return;

		task.status = 'uploading';
		task.percent = percent;
		this.acquireLeaf()?.wrapper?.progress(uploadId, percent);
	}

	private success(uploadId: string) {
		if (!this.setStatus(uploadId, 'success')) return;

		this.acquireLeaf()?.wrapper?.success(uploadId);
	}

	private error(uploadId: string, message = '上传失败') {
		if (!this.setStatus(uploadId, 'error', message)) return;

		this.acquireLeaf()?.wrapper?.error(uploadId, message);
	}

	private complete() {
		this.acquireLeaf()?.wrapper?.complete();
	}

	private setStatus(uploadId: string, status: UploadTaskStatus, message = '') {
		const task = this.tasks.get(uploadId);
		if (!task) return false;

		task.status = status;
		task.message = message;
		return true;
	}

	private acquireLeaf(forceReplay = false) {
		if (!this.enabled || this.tasks.size === 0) return;

		const leaf = this.getCurrentLeaf()
			|| (UploadTask.popup() as UploadTaskLeaf);
		if (forceReplay || leaf !== this.leaf) {
			this.leaf = leaf;
			this.replay(leaf);
		}
		return leaf;
	}

	private getCurrentLeaf() {
		const name = UploadTask.globalOptions.name!;
		return Portal.leafs.get(name) as UploadTaskLeaf | undefined;
	}

	private replay(leaf: UploadTaskLeaf) {
		/*
		 * Portal 被外部销毁或 showTask 重新启用时，从 Context 恢复完整展示状态。
		 */
		const wrapper = leaf.wrapper;
		if (!wrapper) return;

		wrapper.show([...this.tasks.values()]);
		this.tasks.forEach((item, uploadId) => {
			const { status, message, percent } = item;
			if (status === 'uploading') {
				wrapper.start(uploadId);
				wrapper.progress(uploadId, percent);
			} else if (status === 'success') {
				wrapper.success(uploadId);
			} else if (status === 'error') {
				wrapper.error(uploadId, message);
			}
		});
		if (isTaskListSettled([...this.tasks.values()])) {
			wrapper.complete();
		}
	}

	private detach() {
		const leaf = this.getCurrentLeaf();
		if (leaf?.wrapper?.remove([...this.tasks.keys()])) {
			leaf.destroy();
		}
		this.leaf = undefined;
	}
}
