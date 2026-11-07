import type { ExtractPropTypes, PropType } from 'vue';

export const props = {
	modelValue: {
		type: Boolean,
		default: false
	},
	zIndex: {
		type: [Number, String],
		default: 1
	},
	// TODO: left/right
	placement: {
		type: String,
		default: 'top'
	},
	disabled: {
		type: Boolean,
		default: false
	},
	fixed: {
		type: Boolean,
		default: true
	},
	/**
	 * 距离顶部或底部的偏移：数字在 Affix 中为 px、在 MAffix 中为 750 稿长度；字符串原样作为 CSS 长度
	 */
	offset: {
		type: [Number, String] as PropType<number | string>,
		default: 0
	},
	// -> 固钉始终保持在容器内， 超过范围则隐藏(请注意容器避免出现滚动条) 仅fixed为true有效
	target: {
		type: String
	}
};
export type Props = ExtractPropTypes<typeof props>;
