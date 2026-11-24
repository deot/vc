import type { ExtractPropTypes, PropType } from 'vue';

export const props = {
	/**
	 * 是否显示：只读，供 v-model 同步，传入的值不影响判断
	 */
	modelValue: {
		type: Boolean,
		default: false
	},
	/**
	 * 滚动超过该距离后显示：数字在 BackTop 中为 px（默认 200）、在 MBackTop 中为 750 稿长度（默认 400）
	 */
	visibilityHeight: {
		type: Number
	},
	/**
	 * 距滚动容器可视区（页面滚动时为视口）右边、下边的距离：数字在 BackTop 中为 px、在 MBackTop 中为 750 稿长度；字符串原样作为 CSS 长度
	 * 不传时取样式中的默认值（局部变量 --vc-back-top-right / --vc-back-top-bottom）
	 */
	right: {
		type: [Number, String] as PropType<number | string>
	},
	bottom: {
		type: [Number, String] as PropType<number | string>
	},
	// 在按钮边缘画滚动进度环（已滚动距离 / 可滚动距离）
	showProgress: {
		type: Boolean,
		default: false
	},
	// 回到顶部的滚动时长（ms），0 为瞬间到顶；系统开启「减弱动态效果」时也瞬间到顶
	duration: {
		type: Number,
		default: 300
	},
	zIndex: {
		type: [Number, String] as PropType<number | string>
	},
	// 按钮挂到 body：不受祖先 transform、overflow 的影响；为 false 时渲染在原处
	portal: {
		type: Boolean,
		default: true
	}
};

export type Props = ExtractPropTypes<typeof props>;
