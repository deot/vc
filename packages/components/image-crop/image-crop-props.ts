import type { ExtractPropTypes, PropType } from 'vue';
import type { CropData } from './geometry';
import type { CrossOrigin } from '../image-processor/utils';

export type ImageCropSource = string | Blob | File;
export type ImageCropShape = 'square' | 'circle';
export type ImageCropCrossOrigin = CrossOrigin;
export type ImageCropData = CropData;

export interface ImageCropCanvasOptions {
	// 输出宽高；都不传时为原图像素，只传一边时另一边按比例
	width?: number;
	height?: number;
	// 透明区域的底色（如导出 jpeg 时）
	fillColor?: string;
}

export interface ImageCropImageOptions extends ImageCropCanvasOptions {
	// 默认 'image/png'
	type?: string;
	// jpeg / webp 的质量，0–1
	quality?: number;
	// 传入时同时生成 File
	filename?: string;
}

export interface ImageCropImageResult {
	dataURL: string;
	file?: File;
}

export const props = {
	src: [String, Object] as PropType<ImageCropSource>,
	// 裁剪框宽高比；null 为不限（resizable 时可自由调整，否则取图片比例）
	aspectRatio: {
		type: Number as PropType<number | null>,
		default: 1
	},
	shape: {
		type: String as PropType<ImageCropShape>,
		default: 'square'
	},
	// 1 为刚好铺满裁剪框（按当前角度）
	zoom: {
		type: Number,
		default: 1
	},
	maxZoom: {
		type: Number,
		default: 4
	},
	rotate: {
		type: Number,
		default: 0
	},
	resizable: {
		type: Boolean,
		default: false
	},
	disabled: {
		type: Boolean,
		default: false
	},
	crossOrigin: {
		type: String as PropType<ImageCropCrossOrigin>,
		default: 'anonymous'
	}
};

export type Props = ExtractPropTypes<typeof props>;

export type ImageCropOpenOptions = Partial<Omit<Props, 'disabled'>> & ImageCropImageOptions & {
	src: ImageCropSource;
	// 默认取 locale；移动端没有标题
	title?: string;
	okText?: string;
	cancelText?: string;
};

/**
 * await open() 的结果：确定后关闭时兑现，取消（含遮罩、关闭按钮）时拒绝
 */
export interface ImageCropOpenResult extends ImageCropImageResult {
	data: ImageCropData;
}

// 打开的弹层的属性：裁剪属性与导出选项分开传
export const portalProps = {
	cropOptions: {
		type: Object as PropType<Partial<Props>>,
		default: () => ({})
	},
	imageOptions: {
		type: Object as PropType<ImageCropImageOptions>,
		default: () => ({})
	},
	title: String,
	okText: String,
	cancelText: String
};

// open() 的参数拆成弹层属性：导出选项、文案，其余为裁剪属性
export const toPortalProps = (options: ImageCropOpenOptions) => {
	const { width, height, fillColor, type, quality, filename, title, okText, cancelText, ...cropOptions } = options;
	return {
		cropOptions,
		imageOptions: { width, height, fillColor, type, quality, filename },
		title,
		okText,
		cancelText
	};
};
