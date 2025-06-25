import type { ExtractPropTypes } from 'vue';

export const props = {
	modelValue: {
		type: Boolean,
		default: false,
	},
	portalClass: [String, Object],
	placement: {
		type: String,
		default: 'bottom'
	},
	trigger: {
		type: String,
		default: 'hover'
	},
	arrow: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;
