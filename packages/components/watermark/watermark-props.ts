import type { ExtractPropTypes, PropType } from 'vue';

export const props = {
	// 水印文字，数组为多行
	value: [String, Array] as PropType<string | string[]>,
	// 水印图片，优先于 value；加载失败时回退到 value
	src: String,
	// 旋转前单个水印的宽高（px）；文字默认按内容，图片默认宽 100、高按比例
	width: Number,
	height: Number,
	rotate: {
		type: Number,
		default: -20
	},
	// 水印之间的间距 [水平, 垂直]，数字表示两个方向相同
	gap: {
		type: [Number, Array] as PropType<number | number[]>,
		default: 100
	},
	// 首个水印相对容器左上角的偏移 [水平, 垂直]，默认为 gap 的一半
	offset: [Number, Array] as PropType<number | number[]>,
	// 水印层的层级；未传时由样式决定（1，fullscreen 时为 5000）
	zIndex: [Number, String],
	// 水印层挂载的目标：CSS selector 或元素；有默认插槽时不生效（fullscreen 除外，此时默认为 body）
	to: [String, Object] as PropType<string | HTMLElement>,
	// 满屏：水印层使用固定定位铺满视口
	fullscreen: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;
