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
	row: Object,
	render: [Function] as Render,
};
export type Props = ExtractPropTypes<typeof props>;
