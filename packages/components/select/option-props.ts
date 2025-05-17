import type { ExtractPropTypes } from 'vue';

export const props = {
	value: {
		type: [String, Number],
		required: true
	},
	label: {
		type: [String, Number]
	},
	disabled: {
		type: Boolean,
		default: false
	},
	/**
	 * 是否可过滤
	 */
	filterable: {
		type: Boolean,
		default: true
	}
};
export type Props = ExtractPropTypes<typeof props>;
