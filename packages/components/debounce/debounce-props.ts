import type { ExtractPropTypes } from 'vue';

export const props = {
	wait: {
		type: Number,
		default: 250
	},
	tag: {
		type: [String, Object],
		default: 'div'
	},
	event: {
		type: String,
		default: 'click'
	}
};
export type Props = ExtractPropTypes<typeof props>;