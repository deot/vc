import type { ExtractPropTypes, PropType } from 'vue';
import type { Props as MCustomerProps } from '../../customer/customer-props';

export const props = {
	content: [String, Function] as PropType<string | MCustomerProps['render']>,
	maskClosable: {
		type: Boolean,
		default: true
	},
	duration: {
		type: Number,
		default: 3000
	},
	mode: {
		type: String as PropType<'info' | 'loading' | 'success' | 'warning' | 'error'>,
		default: 'info',
		validator: (val: string) => ['info', 'loading', 'success', 'warning', 'error'].includes(val)
	}
};
export type Props = ExtractPropTypes<typeof props>;