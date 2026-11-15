import type { ExtractPropTypes } from 'vue';

export const props = {
	value: {
		type: [String, Number],
		value: undefined
	},
	label: {
		type: [String, Number],
		value: undefined
	},
	disabled: {
		type: Boolean,
		default: false
	},
	selected: {
		type: Boolean,
		default: false
	},
	divided: {
		type: Boolean,
		default: false
	},
	closable: {
		type: Boolean,
		default: true
	}
};
export type Props = ExtractPropTypes<typeof props>;
