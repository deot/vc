import type { ExtractPropTypes, PropType } from 'vue';
import { valueType } from '../customer/customer-props';

export const props = {
	modelValue: {
		type: Boolean,
		default: true
	},
	type: {
		type: String as PropType<'success' | 'info' | 'error' | 'warning'>,
		default: 'info'
	},
	title: {
		type: valueType,
		default: ''
	},
	description: {
		type: valueType,
		default: ''
	},
	icon: {
		type: [String, Boolean],
		default: true
	},
	closable: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;
