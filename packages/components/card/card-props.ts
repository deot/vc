import type { ExtractPropTypes, PropType } from 'vue';
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
	// 数字为 px（MCard 为 750 稿），字符串为 CSS 长度
	padding: {
		type: [Number, String] as PropType<number | string>,
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
