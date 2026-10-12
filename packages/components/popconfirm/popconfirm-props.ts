import type { ExtractPropTypes } from 'vue';
import { valueType } from '../customer/customer-props';

export const props = {
	title: {
		type: valueType,
		default: ''
	},
	content: {
		type: valueType,
		default: ''
	},
	modelValue: {
		type: Boolean,
		default: false
	},
	placement: {
		type: String,
		default: 'top'
	},
	trigger: {
		type: String,
		default: 'click'
	},
	okText: {
		type: String,
		default: undefined
	},
	cancelText: {
		type: String,
		default: undefined
	},
	okType: {
		type: String,
		default: 'primary'
	},
	cancelType: {
		type: String,
		default: 'default'
	},
	type: {
		type: String,
		default: 'warning',
		validator: (v: string) => /(warning|info|success|error)/.test(v),
	},
	width: [String, Number],
	portalClass: [String, Object]
};
export type Props = ExtractPropTypes<typeof props>;
