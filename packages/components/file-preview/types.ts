import type { ComponentInternalInstance, VNode } from 'vue';

export type FilePreviewFileType = 'image' | 'video' | 'audio' | 'file';

export interface FilePreviewItem {
	type: FilePreviewFileType;
	source: string;
	name: string;
	thumbnail?: string;
	/**
	 * 缩略图元素：打开时从它放大，关闭时回到它；没有时只有点击打开的那一项使用点击的元素
	 */
	element?: Element | null;
	[key: string]: any;
}

export type FilePreviewItemInput = string | (Partial<FilePreviewItem> & { source: string });

export type FilePreviewData = string | FilePreviewItemInput[];

export interface FilePreviewEnhancerPayload {
	current: number;
	data: FilePreviewItem[];
	instance: ComponentInternalInstance | null;
}

export type FilePreviewImageFit = 'max-edge' | 'actual';

export interface FilePreviewImageOptions {
	/**
	 * 初始展示。max-edge 放大到长边贴齐视口；actual 按自然像素，超出视口才缩小
	 */
	fit?: FilePreviewImageFit;
	/**
	 * 相对初始尺寸的最大倍数。按钮、滚轮和捏合的稳定缩放都不超过它。默认 10
	 */
	max?: number;
	/**
	 * 相对初始尺寸的最小倍数。缩小按钮和滚轮不低于它。默认 1。捏合仍可临时缩得更小，用于关闭
	 */
	min?: number;
}

export interface FilePreviewSlideContext {
	type: FilePreviewFileType;
	row: FilePreviewItem;
	index: number;
	close: () => void;
	instance: ComponentInternalInstance | null;
	active: boolean;
}

export interface FilePreviewOpenOptions {
	data: FilePreviewData;
	current?: number;
	instance?: ComponentInternalInstance | null;
	/**
	 * 从它放大、缩回它；不传时取打开它的那次点击（请求回来后才打开也算），传 null 时不用点击的元素
	 */
	triggerElement?: Element | null;
	onClose?: () => void;
}

export interface FilePreviewOptions {
	/**
	 * 通过地址或文件名识别类型，返回空值时回退内置规则
	 */
	getFileType?: (data: { source: string }) => FilePreviewFileType | null | undefined | void;
	/**
	 * 通过地址推导文件名，返回空值时回退内置规则；数据中显式的name/label优先
	 */
	getFileName?: (data: { source: string }) => string | null | undefined | void;
	/**
	 * 返回真值（或 resolve 真值）表示已接管，不再执行内置预览
	 */
	enhancer?: (payload: FilePreviewEnhancerPayload) => unknown;
	/**
	 * 替换某一页。返回 VNode 时用它；返回 false、null、undefined 或不返回时用内置页
	 */
	renderSlide?: (data: FilePreviewSlideContext) => VNode | false | null | undefined | void;
	/**
	 * 图片页配置
	 */
	imageOptions?: FilePreviewImageOptions;
}
