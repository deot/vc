import type { ExtractPropTypes } from 'vue';

export const props = {
	tag: {
		type: String,
		default: 'div'
	},
	value: {
		type: [String, Number]
	}
};
export type Props = ExtractPropTypes<typeof props>;
