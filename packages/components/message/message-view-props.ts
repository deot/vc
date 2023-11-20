import type { ExtractPropTypes, PropType } from 'vue';
import type { Props as CustomerProps } from '../customer/customer-props';

export const props = {
	content: [String, Function] as PropType<string | CustomerProps['render']>,
	mask: {
		type: Boolean,
		default: true
	},
	maskClosable: {
		type: Boolean,
		default: true
	},
	fixed: {
		type: Boolean,
		default: true
	},
	duration: {
		type: Number,
		default: 1500
	},
	top: {
		type: Number,
		default: 30,
	},
	closable: {
		type: Boolean,
		default: false,
	},
	mode: {
		type: String as PropType<'info' | 'loading' | 'success' | 'warning' | 'error'>,
		default: 'info',
		validator: (v: string) => /(info|loading|success|error|warning)/.test(v)
	},
	// 这个相当于Modal中的onCancel，支持Promise
	onBeforeClose: Function
};
export type Props = ExtractPropTypes<typeof props>;