import type { ExtractPropTypes } from 'vue';

export const props = {
	type: {
		type: String,
		validator: (v: string) => /^(line|card)$/.test(v),
		default: 'line'
	},
	modelValue: {
		type: [String, Number]
	},
	animated: {
		type: Boolean,
		default: false
	},
	afloat: {
		type: Boolean,
		default: true
	},
	closable: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;
