import type { ExtractPropTypes } from 'vue';

export const props = {
	src: String,
	fit: String,
	lazy: Boolean,
	wrapper: [Object, String],
};
export type Props = ExtractPropTypes<typeof props>;
