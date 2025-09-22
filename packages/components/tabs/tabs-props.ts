import type { ExtractPropTypes } from 'vue';

export const props = {
	type: {
		type: String,
		validator: (v: string) => /^(line|card)$/.test(v),
		default: 'line'
	},
	modelValue: {
		type: [String, Number, Boolean]
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
	},
	barStyle: [Object, String],
	contentStyle: [Object, String],
	barClass: [Object, String],
	contentClass: [Object, String],
};
export type Props = ExtractPropTypes<typeof props>;
