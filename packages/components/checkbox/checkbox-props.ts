import type { ExtractPropTypes, PropType } from 'vue';
import { valueOrBooleanType } from '../customer/customer-props';

export const CHECKBOX_SHAPES = ['circle', 'square'] as const;
export type CheckboxShape = typeof CHECKBOX_SHAPES[number];

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
		type: valueOrBooleanType,
		default: undefined
	},
	indeterminate: {
		type: Boolean,
		default: false
	},
	/**
	 * 不设时取分组的shape，再兜底为平台默认（桌面square，移动circle）
	 */
	shape: {
		type: String as PropType<CheckboxShape>,
		validator: (v: string) => CHECKBOX_SHAPES.includes(v as any)
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
