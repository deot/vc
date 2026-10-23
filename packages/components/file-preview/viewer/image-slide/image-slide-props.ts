import type { ExtractPropTypes, PropType } from 'vue';
import type { FilePreviewImageFit } from '../../types';
import { props as slideProps } from '../slide-props';
import type { Size } from '../utils';

export const props = {
	...slideProps,
	fit: {
		type: String as PropType<FilePreviewImageFit>,
		default: 'max-edge'
	},
	/**
	 * 相对初始尺寸的最大倍数
	 */
	max: {
		type: Number,
		default: 10
	},
	/**
	 * 相对初始尺寸的最小倍数
	 */
	min: {
		type: Number,
		default: 1
	},
	viewport: {
		type: Object as PropType<Size>,
		required: true as const
	},
	/**
	 * 大图解码前垫在下面的缩略图，和大图同一位置一起放大；没给宽高时先按它的比例摆放
	 */
	placeholder: Object as PropType<{ src: string; size: Size }>
};
export type Props = ExtractPropTypes<typeof props>;
