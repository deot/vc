import type { ExtractPropTypes } from 'vue';

export const props = {
	type: String,
	inherit: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;
