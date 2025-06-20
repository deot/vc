import type { ExtractPropTypes } from 'vue';

export const props = {
	modelValue: {
		type: [String, Number, Boolean],
		default: false
	},
	checkedValue: {
		type: [String, Number, Boolean],
		default: true
	},
	uncheckedValue: {
		type: [String, Number, Boolean],
		default: false
	},
	disabled: {
		type: Boolean,
		default: false
	},
	name: {
		type: String
	},
	checkedText: {
		type: String,
		default: ''
	},
	uncheckedText: {
		type: String,
		default: ''
	},
	width: {
		type: Number,
		default: 36
	},
	height: {
		type: Number,
		default: 20
	},
	borderWidth: {
		type: Number,
		default: 1
	}
};
export type Props = ExtractPropTypes<typeof props>;
