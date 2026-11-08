import type { ExtractPropTypes } from 'vue';

export const props = {
	modelValue: {
		type: Array,
		default: () => ([])
	},
	styleless: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;
