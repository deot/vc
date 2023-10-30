import type { ExtractPropTypes } from 'vue';

export const props = {
	tag: {
		type: String,
		default: 'div'
	}
};
export type Props = ExtractPropTypes<typeof props>;