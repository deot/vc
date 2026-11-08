import type { ExtractPropTypes, PropType } from 'vue';
import { CHECKBOX_SHAPES } from './checkbox-props';
import type { CheckboxShape } from './checkbox-props';

export const props = {
	modelValue: {
		type: Array,
		default: () => ([])
	},
	disabled: {
		type: Boolean,
		default: false
	},
	/**
	 * 最多可选数量，0表示不限；达到上限后未选中的项禁用
	 */
	max: {
		type: Number,
		default: 0
	},
	vertical: {
		type: Boolean,
		default: false
	},
	shape: {
		type: String as PropType<CheckboxShape>,
		validator: (v: string) => CHECKBOX_SHAPES.includes(v as any)
	},
	styleless: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;
