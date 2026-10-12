import type { ExtractPropTypes, PropType } from 'vue';
import { valueType } from '../customer/customer-props';

export const props = {
	title: valueType,
	content: valueType,
	// 单位ms
	duration: {
		type: Number,
		default: 4500
	},
	closable: {
		type: Boolean,
		default: true,
	},
	mode: {
		type: String as PropType<'info' | 'loading' | 'success' | 'warning' | 'error'>,
		validator: (v: string) => /(info|loading|success|error|warning)/.test(v)
	},
	top: {
		type: Number,
		default: 24
	},
	fixed: {
		type: Boolean,
		default: true
	},
	// 这个相当于Modal中的onCancel，支持Promise
	onBeforeClose: Function
};
export type Props = ExtractPropTypes<typeof props>;
