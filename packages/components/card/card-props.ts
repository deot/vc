import type { ExtractPropTypes } from 'vue';

export const props = {
	border: {
		type: Boolean,
		default: true
	},
	shadow: {
		type: Boolean,
		default: false
	},
	padding: {
		type: Number,
		default: 16
	},
	title: {
		type: String,
	},
	icon: {
		type: String,
	}
};
export type Props = ExtractPropTypes<typeof props>;
