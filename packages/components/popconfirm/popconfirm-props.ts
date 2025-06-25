import type { ExtractPropTypes, PropType } from 'vue';
import type { Props as CustomerProps } from '../customer/customer-props';

export const props = {
	title: {
		type: [String, Function] as PropType<string | CustomerProps['render']>,
		default: ''
	},
	content: {
		type: [String, Function] as PropType<string | CustomerProps['render']>,
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
		default: '确定'
	},
	cancelText: {
		type: String,
		default: '取消'
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
