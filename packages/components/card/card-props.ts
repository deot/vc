import type { ExtractPropTypes } from 'vue';
import { valueType } from '../customer/customer-props';

export const props = {
	border: {
		type: Boolean,
		default: true
	},
	shadow: {
		type: Boolean,
		default: false
	},
	padding: {
		type: Number,
		default: 16
	},
	title: {
		type: valueType,
	},
	icon: {
		type: String,
	}
};
export type Props = ExtractPropTypes<typeof props>;
