import type { ExtractPropTypes, PropType } from 'vue';
import { CHECKBOX_SHAPES, CHECKBOX_SIZES } from './checkbox-props';
import type { CheckboxShape, CheckboxSize } from './checkbox-props';

export const CHECKBOX_GROUP_TYPES = ['default', 'button', 'card', 'capsule', 'text', 'round'] as const;
export type CheckboxGroupType = typeof CHECKBOX_GROUP_TYPES[number];

export const props = {
	modelValue: {
		type: Array,
		default: () => ([])
	},
	/**
	 * 分组样式：default为勾选框，其余为标签式（与RadioGroup相同）
	 */
	type: {
		type: String as PropType<CheckboxGroupType>,
		default: 'default',
		validator: (v: string) => CHECKBOX_GROUP_TYPES.includes(v as any)
	},
	size: {
		type: String as PropType<CheckboxSize>,
		default: 'medium',
		validator: (v: string) => CHECKBOX_SIZES.includes(v as any)
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
