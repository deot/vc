import type { ExtractPropTypes } from 'vue';

export const props = {
	tag: {
		type: String,
		default: 'div'
	},
	fill: {
		type: [Boolean, Array],
		default: true
	}
};
export type Props = ExtractPropTypes<typeof props>;
