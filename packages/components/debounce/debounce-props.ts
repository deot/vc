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
	include: {
		type: RegExp,
		default: () => /^on([A-Z])/
	},
	exclude: RegExp
};
export type Props = ExtractPropTypes<typeof props>;