import type { ExtractPropTypes, PropType } from 'vue';

export type SkeletonShape = 'square' | 'circle';

export interface SkeletonImage {
	// 边长：数字为 px（MSkeleton 为 750 稿），字符串为 CSS 长度
	size?: number | string;
	shape?: SkeletonShape;
}

export const props = {
	// true 显示骨架；false 渲染默认插槽
	loading: {
		type: Boolean,
		default: true
	},
	// 闪光动画；系统开启“减弱动态效果”时停止
	animated: {
		type: Boolean,
		default: true
	},
	// 标题条：数字 / 字符串为宽度（数字为 px，MSkeleton 为 750 稿），true 为默认宽度
	title: {
		type: [Boolean, Number, String] as PropType<boolean | number | string>,
		default: true
	},
	// 段落：数字为行数（末行较短）；数组为逐行宽度，行数即数组长度
	rows: {
		type: [Number, Array] as PropType<number | Array<number | string>>,
		default: 3
	},
	// 左侧图片占位：true 为默认尺寸的方形；circle 用作头像
	image: {
		type: [Boolean, Object] as PropType<boolean | SkeletonImage>,
		default: false
	},
	// 骨架重复份数，用于列表加载
	repeat: {
		type: Number,
		default: 1
	},
	// 毫秒：loading 持续超过 delay 才显示骨架；期间保留已有内容（首次加载时为空）
	delay: {
		type: Number,
		default: 0
	}
};
export type Props = ExtractPropTypes<typeof props>;
