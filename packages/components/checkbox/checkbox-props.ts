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
	// 当前选项value值
	value: {
		type: [String, Number, Boolean],
		default: undefined
	},
	// 当前选项label值
	label: {
		type: [String, Number, Boolean],
		default: undefined
	},
	indeterminate: {
		type: Boolean,
		default: false
	},
	// 原生 `name` 属性
	name: String,
	// group模式下无效
	checkedValue: {
		type: [String, Number, Boolean],
		default: true
	},
	// group模式下无效
	uncheckedValue: {
		type: [String, Number, Boolean],
		default: false
	},
};
export type Props = ExtractPropTypes<typeof props>;
