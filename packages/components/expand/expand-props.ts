import type { ExtractPropTypes } from 'vue';

export const props = {
	tag: {
		type: String,
		default: 'div'
	},
	modelValue: {
		type: Boolean,
		default: false
	},
	// 子节点每次toggle不销毁
	alive: {
		type: Boolean,
		default: true
	},
};
export type Props = ExtractPropTypes<typeof props>;
