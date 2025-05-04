import type { ExtractPropTypes } from 'vue';

export const props = {
	// 每秒移动多少px
	speed: {
		type: Number,
		default: 50,
	},
	content: [String, Function],
	animated: {
		type: Boolean,
		default: true,
	},
	autoplay: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;
