import type { ExtractPropTypes } from 'vue';
import { renderType } from '../../customer/customer-props';

export const props = {
	value: {
		type: [String, Number],
		required: true
	},
	label: {
		type: [String, Number]
	},
	row: Object,
	render: renderType,
	renderLabel: renderType,
};
export type Props = ExtractPropTypes<typeof props>;
