import type { ExtractPropTypes, PropType } from 'vue';

export const props = {
	// 数字为 px（MSpin 为 750 稿），字符串为 CSS 长度
	size: {
		type: [Number, String] as PropType<number | string>,
		default: 28
	},
	foreground: {
		type: String,
		default: 'var(--vc-spin-color-light-deepest, var(--vc-color-light-deepest))'
	},
	background: {
		type: String,
		default: 'var(--vc-spin-color-primary, var(--vc-color-primary))'
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
