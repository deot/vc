import type { ComponentInternalInstance } from 'vue';

export type FilePreviewFileType = 'image' | 'video' | 'audio' | 'file';

export interface FilePreviewItem {
	type: FilePreviewFileType;
	source: string;
	name: string;
	thumbnail?: string;
	[key: string]: any;
}

export type FilePreviewItemInput = string | (Partial<FilePreviewItem> & { source: string });

export type FilePreviewData = string | FilePreviewItemInput[];

export interface FilePreviewEnhancerPayload {
	current: number;
	data: FilePreviewItem[];
	instance: ComponentInternalInstance | null;
}

export interface FilePreviewOpenOptions {
	data: FilePreviewData;
	current?: number;
	instance?: ComponentInternalInstance | null;
}

export interface FilePreviewOptions {
	/**
	 * 通过地址或文件名识别类型，返回空值时回退内置规则
	 */
	getFileType?: (source: string) => FilePreviewFileType | null | undefined | void;
	/**
	 * 通过地址推导文件名，返回空值时回退内置规则；数据中显式的name/label优先
	 */
	getFileName?: (source: string) => string | null | undefined | void;
	/**
	 * 返回真值（或 resolve 真值）表示已接管，不再执行内置预览
	 */
	enhancer?: (payload: FilePreviewEnhancerPayload) => unknown;
}
