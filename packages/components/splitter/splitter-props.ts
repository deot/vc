import type { ExtractPropTypes } from 'vue';

export const props = {
	tag: {
		type: String,
		default: 'div'
	},
	/**
	 * 面板上下排列
	 */
	vertical: {
		type: Boolean,
		default: false
	},
	/**
	 * 拖动时只移动预览线，松开再应用尺寸（面板内容较重时，如图表）
	 */
	lazy: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;
