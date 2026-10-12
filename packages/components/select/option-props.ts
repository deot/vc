import type { ExtractPropTypes } from 'vue';
import { renderType } from '../customer/customer-props';

export const props = {
	value: {
		type: [String, Number],
		required: true
	},
	label: {
		type: [String, Number]
	},
	disabled: {
		type: Boolean,
		default: false
	},
	/**
	 * 是否可过滤
	 */
	filterable: {
		type: Boolean,
		default: true
	},
	render: renderType,
	renderLabel: renderType,
	row: Object
};
export type Props = ExtractPropTypes<typeof props>;
