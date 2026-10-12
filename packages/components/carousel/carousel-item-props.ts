import type { ExtractPropTypes } from 'vue';
import { valueType } from '../customer/customer-props';

export const props = {
	name: String,
	label: {
		type: valueType,
		default: ''
	},

	// card大小
	width: {
		type: [Number, String],
		default: '70%'
	},

	// card之间间距, 或者滑动时候的间距
	gap: {
		type: Number,
		default: 0
	},
	scale: {
		type: Number,
		default: 0.83
	}
};
export type Props = ExtractPropTypes<typeof props>;
