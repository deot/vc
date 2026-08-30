import type {
	UploadEventArgs,
	UploadFile
} from '../types';

/**
 * Cycle、父组件与 Task 共用公开回调派生出的对象 payload。
 * 返回值型 Hook 由 Upload 直接调用，不进入周期事件链路。
 */
export type UploadLifecycleEventName
	= 'begin'
		| 'file-start'
		| 'file-progress'
		| 'file-success'
		| 'file-error'
		| 'complete';

export type UploadLifecycleEventArgs = UploadEventArgs<UploadLifecycleEventName>;

/**
 * 与 Vue setup 第二个参数保持一致的父级通信能力。
 */
export interface UploadCycleParent {
	emit(...event: UploadLifecycleEventArgs): void;
}

/**
 * 创建上传周期所需的文件信息。
 */
export interface UploadCycleOptions {
	rawFiles: File[];
	files: UploadFile[];
}

/**
 * 创建单个 UploadCycleLeaf 所需的固定配置。
 */
export interface UploadCycleLeafOptions extends UploadCycleOptions {
	parallel: boolean;
	loadingInstance?: { destroy: () => void };
}

/**
 * 周期卸载时需要统一取消的上传请求。
 */
export interface UploadRequestHandle {
	cancel: () => void;
}
