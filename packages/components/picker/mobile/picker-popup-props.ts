import type { ExtractPropTypes, PropType } from 'vue';
import { valueType } from '../../customer/customer-props';

export const props = {
	modelValue: {
		type: Boolean,
		default: true
	},
	visible: {
		type: Boolean as PropType<boolean | undefined>,
		default: undefined
	},
	title: {
		type: valueType,
		default: ''
	},
	cancelText: String,
	okText: String,
	showToolbar: {
		type: Boolean,
		default: true
	}
};

export type Props = ExtractPropTypes<typeof props>;
