import type { ExtractPropTypes } from 'vue';

export const props = {
	src: String,
	thumbnail: String,
	fit: String,
	lazy: Boolean,
	wrapper: [Object, String],
	previewable: {
		type: Boolean,
		default: true
	},
	formatter: Function,
};
export type Props = ExtractPropTypes<typeof props>;
