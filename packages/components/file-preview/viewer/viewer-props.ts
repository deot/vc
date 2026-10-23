import type { ComponentInternalInstance, ExtractPropTypes, PropType } from 'vue';
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
	 * 点击打开的元素：当前项没有 element 时，打开的那一项用它放大与回退
	 */
	triggerElement: Object as PropType<Element | null>,
	onClose: Function as PropType<() => void>
};
export type Props = ExtractPropTypes<typeof props>;
