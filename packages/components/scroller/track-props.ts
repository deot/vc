import type { ExtractPropTypes, StyleValue, PropType } from 'vue';

export const props = {
	vertical: Boolean,
	wrapperSize: {
		type: Number,
		default: 1
	},
	contentSize: {
		type: Number,
		default: 1
	},
	always: {
		type: Boolean,
		default: false,
	},
	// 最小的thumb值
	thumbMinSize: {
		type: Number,
		default: 30
	},
	thumbStyle: [Object, String, Array] as PropType<StyleValue>,
	thumbClass: [Object, String, Array] as PropType<StyleValue>,
	// 轨道偏移值（头尾）
	offset: {
		type: Array as PropType<number[]>,
		default: () => ([0, 0])
	}
};
export type Props = ExtractPropTypes<typeof props>;
