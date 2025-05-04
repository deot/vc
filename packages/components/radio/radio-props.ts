import type { ExtractPropTypes } from 'vue';

export const props = {
	disabled: {
		type: Boolean,
		default: false
	},
	modelValue: {
		type: [String, Number, Boolean],
		default: false
	},
	value: {
		type: [String, Number, Boolean],
		default: undefined
	},
	label: {
		type: [String, Number, Boolean],
		default: undefined
	},
	name: {
		type: String
	},
	/**
	 * group模式下无效
	 */
	trueValue: {
		type: [String, Number, Boolean],
		default: true
	},
	falseValue: {
		type: [String, Number, Boolean],
		default: false
	},
};
export type Props = ExtractPropTypes<typeof props>;
