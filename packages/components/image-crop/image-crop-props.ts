import type { ExtractPropTypes, PropType } from 'vue';

export type ImageCropSource = string | Blob | File;
export type ImageCropBorder = number | [number, number] | number[];
export type ImageCropOutputSize = number | [number] | [number, number] | number[];
export type ImageCropMaskColor = string | number[];
export type ImageCropCrossOrigin = '' | 'anonymous' | 'use-credentials';

export interface ImageCropPosition {
	x: number;
	y: number;
}

export interface ImageCropImageState extends ImageCropPosition {
	resource: HTMLImageElement | null;
	width: number;
	height: number;
}

export interface ImageCropDimensions {
	canvas: {
		width: number;
		height: number;
	};
	rotate: number;
	border: ImageCropBorder;
	width: number;
	height: number;
}

export interface ImageCropRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface ImageCropGetImageOptions {
	isNormal?: boolean;
	filename?: string;
	getFile?: boolean;
}

export const props = {
	src: [String, Object] as PropType<ImageCropSource>,
	scale: {
		type: Number,
		default: 1
	},
	rotate: {
		type: Number,
		default: 0
	},
	border: {
		type: [Number, Array] as PropType<ImageCropBorder>,
		default: 20
	},
	borderRadius: {
		type: Number,
		default: 0
	},
	outputSize: {
		type: [Number, Array] as PropType<ImageCropOutputSize>,
		default: 750
	},
	position: Object as PropType<ImageCropPosition>,
	maskColor: {
		type: [String, Array] as PropType<ImageCropMaskColor>,
		default: () => [0, 0, 0, 0.5]
	},
	crossOrigin: {
		type: String as PropType<ImageCropCrossOrigin>,
		default: 'anonymous',
		validator: (value: string) => /^(|anonymous|use-credentials)$/.test(value)
	},
	droppable: {
		type: Boolean,
		default: true
	}
};

export type Props = ExtractPropTypes<typeof props>;
