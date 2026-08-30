import type { ComponentPublicInstance } from 'vue';
import type { PortalLeaf } from '../../portal/portal-leaf';
import type { UploadFile } from '../types';

/**
 * Task 内部恢复展示只需要文件的轻量元数据，不能长期持有 File/Blob。
 */
export type UploadTaskSource = Pick<
	UploadFile,
	'uploadId' | 'name' | 'size' | 'percent'
>;

/**
 * 单个上传任务在浮层中的展示状态。
 */
export type UploadTaskStatus = 'pending' | 'uploading' | 'success' | 'error';

/**
 * 任务浮层渲染单个文件所需的最小数据集合。
 */
export interface UploadTaskItem extends UploadTaskSource {
	/**
	 * 当前上传状态。
	 */
	status: UploadTaskStatus;
	/**
	 * 失败时展示的错误信息。
	 */
	message: string;
}

/**
 * UploadTaskView 向 Portal Leaf 暴露的任务操作。
 */
export interface UploadTaskExposed {
	show: (files: UploadTaskSource[]) => void;
	hide: () => void;
	clear: () => void;
	remove: (uploadIds: string[]) => boolean;
	update: (file: UploadTaskSource) => void;
	start: (uploadId: string) => void;
	progress: (uploadId: string, percent: number) => void;
	success: (uploadId: string) => void;
	error: (uploadId: string, message?: string) => void;
	complete: () => void;
}

/**
 * TaskContext 使用的 Portal Leaf 只收窄 wrapper，不改变 Portal 的生命周期接口。
 */
export type UploadTaskLeaf = Omit<PortalLeaf, 'wrapper'> & {
	wrapper?: ComponentPublicInstance & UploadTaskExposed;
};
