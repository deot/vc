import type { ExtractPropTypes } from 'vue';

export const props = {
	size: {
		type: Number,
		default: 28
	},
	foreground: {
		type: String,
		default: '#ccc'
	},
	background: {
		type: String,
		default: 'var(--vc-color-primary)'
	},
	/**
	 * 待开发
	 */
	fixed: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;
