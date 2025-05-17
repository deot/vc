import type { ExtractPropTypes } from 'vue';

export const props = {
	value: {
		type: [String, Number],
		required: true
	},
	label: {
		type: [String, Number]
	}
};
export type Props = ExtractPropTypes<typeof props>;
