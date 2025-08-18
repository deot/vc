import type { ExtractPropTypes } from 'vue';
import type { Render } from '../customer/types';

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
	render: [Function] as Render,
	row: Object
};
export type Props = ExtractPropTypes<typeof props>;
