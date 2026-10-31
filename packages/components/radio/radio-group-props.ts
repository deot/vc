import type { ExtractPropTypes, PropType } from 'vue';
import { getUid } from '@deot/helper-utils';
import { RADIO_SIZES } from './radio-props';
import type { RadioGroupType, RadioSize } from './types';

const TYPES = ['default', 'button', 'card', 'capsule', 'text', 'round'] as const;

export const props = {
	modelValue: {
		type: [String, Number],
		default: ''
	},
	type: {
		type: String as PropType<RadioGroupType>,
		default: 'default',
		validator: (v: string) => TYPES.includes(v as any)
	},
	size: {
		type: String as PropType<RadioSize>,
		default: 'medium',
		validator: (v: string) => RADIO_SIZES.includes(v as any)
	},
	vertical: {
		type: Boolean,
		default: false
	},
	name: {
		type: String,
		default: () => getUid('radio')
	},
	disabled: {
		type: Boolean,
		default: false
	},
	fragment: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;
