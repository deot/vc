import type { ExtractPropTypes, PropType } from 'vue';
import { valueOrBooleanType } from '../customer/customer-props';
import type { RadioSize } from './types';

export const RADIO_SIZES = ['mini', 'small', 'medium', 'large'] as const;

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
		type: valueOrBooleanType,
		default: undefined
	},
	name: {
		type: String
	},
	/**
	 * 不设时取分组的size，再兜底为medium
	 */
	size: {
		type: String as PropType<RadioSize>,
		validator: (v: string) => RADIO_SIZES.includes(v as any)
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
	}
};
export type Props = ExtractPropTypes<typeof props>;
