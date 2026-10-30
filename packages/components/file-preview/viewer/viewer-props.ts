import type { ComponentInternalInstance, ExtractPropTypes, PropType } from 'vue';
import type { VirtualElement } from '../../vc';
import type { FilePreviewItem } from '../types';

export const props = {
	data: {
		type: Array as PropType<FilePreviewItem[]>,
		required: true as const
	},
	current: {
		type: Number,
		default: 0
	},
	instance: {
		type: Object as PropType<ComponentInternalInstance | null>,
		default: null
	},
	/**
	 * 打开那一项的起点（open 时已按 triggerElement、element、点击位置的顺序取好），其余项用各自的 element
	 */
	triggerElement: Object as PropType<Element | VirtualElement | null>,
	/**
	 * 图片是否用缩略图垫底立即放大；不传时用全局 imageOptions.placeholder
	 */
	placeholder: {
		type: Boolean,
		default: undefined
	},
	onClose: Function as PropType<() => void>
};
export type Props = ExtractPropTypes<typeof props>;
