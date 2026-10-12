import type { ExtractPropTypes } from 'vue';
import { valueType } from '../customer/customer-props';

export const props = {
	// 每秒移动多少px
	speed: {
		type: Number,
		default: 50,
	},
	content: valueType,
	animated: {
		type: Boolean,
		default: true,
	},
	autoplay: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;
