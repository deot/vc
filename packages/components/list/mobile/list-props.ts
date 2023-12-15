import type { ExtractPropTypes } from 'vue';

export const props = {
	tag: {
		type: String,
		default: 'div'
	},
	labelWidth: {
		type: [String, Number],
		default: ''
	},
	border: {
		type: Boolean,
		default: true
	}
};
export type Props = ExtractPropTypes<typeof props>;
