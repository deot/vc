import type { ExtractPropTypes, PropType } from 'vue';
import type { SkeletonShape } from './skeleton-props';

export const props = {
	// 数字为 px（MSkeletonItem 为 750 稿），字符串为 CSS 长度；不传时宽度占满、高度为一行
	width: [Number, String] as PropType<number | string>,
	height: [Number, String] as PropType<number | string>,
	// circle：两端全圆，方块为圆形、长条为胶囊
	shape: {
		type: String as PropType<SkeletonShape>,
		default: 'square',
		validator: (v: string) => ['square', 'circle'].includes(v)
	},
	// 不传时跟随外层 Skeleton；单独使用时为 true
	animated: {
		type: Boolean,
		default: undefined
	}
};
export type Props = ExtractPropTypes<typeof props>;
