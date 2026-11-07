import type { ExtractPropTypes } from 'vue';
import { valueType } from '../../customer/customer-props';

export const props = {
	tag: {
		type: String,
		default: 'div'
	},
	labelWidth: {
		type: [String, Number],
		default: ''
	},
	border: {
		type: Boolean,
		default: true
	},
	// 列表上方的分组标题
	header: valueType,
	// 列表下方的说明
	footer: valueType
};
export type Props = ExtractPropTypes<typeof props>;
