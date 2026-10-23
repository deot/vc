import type { ExtractPropTypes } from 'vue';

export const props = {
	tag: {
		type: String,
		default: 'div'
	},
	/**
	 * 阻止浏览器在区域内滚动、缩放与选中文本（touch-action: none），滚轮也不再滚动页面
	 */
	prevent: {
		type: Boolean,
		default: true
	},
	/**
	 * 越过该距离（px）才算移动，未越过时视为点按
	 */
	threshold: {
		type: Number,
		default: 8
	},
	/**
	 * swipe 的速度阈值（px/ms）
	 */
	flickThreshold: {
		type: Number,
		default: 0.6
	},
	/**
	 * 从匹配该选择器的元素按下时不识别手势，如 'button, a, input'
	 */
	ignore: String
};
export type Props = ExtractPropTypes<typeof props>;
