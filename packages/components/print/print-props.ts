import type { ExtractPropTypes } from 'vue';

export const props = {
	value: String,
	tag: {
		type: [String, Object, Function],
		default: 'div'
	}
};
export type Props = ExtractPropTypes<typeof props>;
