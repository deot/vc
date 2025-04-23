import type { ExtractPropTypes } from 'vue';

export const props = {
	tag: {
		type: String,
		default: 'div'
	},
	accordion: {
		type: Boolean,
		default: false
	},
	modelValue: {
		type: [Array, String, Number]
	},
	alive: {
		type: Boolean,
		default: true
	},
	// TODO: 添加默认样式
	styleless: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;
