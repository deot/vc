import type { ExtractPropTypes } from 'vue';

export const props = {
	vertical: {
		type: Boolean,
		default: false
	},
	circle: {
		type: Boolean,
		default: false
	},
	size: {
		type: String,
		default: 'medium'
	},
	fragment: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;