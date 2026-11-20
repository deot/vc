import type { ExtractPropTypes, PropType } from 'vue';

export const props = {
	// 数字为 px（MSpin 为 750 稿），字符串为 CSS 长度
	size: {
		type: [Number, String] as PropType<number | string>,
		default: 28
	},
	// 转动弧的颜色，不传时为 --vc-spin-color（默认主色）
	color: String,
	// 轨道的颜色，不传时为 --vc-spin-track-color（默认 color-light-deepest）
	trackColor: String,
	// 图标下方的文字提示，也可用 tip 插槽
	tip: String,
	/**
	 * 是否加载中：为 false 时不显示图标；包裹内容时同时撤掉遮罩
	 */
	loading: {
		type: Boolean,
		default: true
	},
	/**
	 * 延迟显示（ms）：加载在此之前结束则不显示，避免一闪而过；结束时立即隐藏
	 */
	delay: {
		type: Number,
		default: 0
	},
	/**
	 * 包裹内容时是否带蒙层：带蒙层时内容变淡且不可操作；为 false 时只在内容上居中显示图标，内容仍可操作
	 */
	mask: {
		type: Boolean,
		default: true
	}
};
export type Props = ExtractPropTypes<typeof props>;
