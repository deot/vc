import type { ExtractPropTypes, PropType } from 'vue';

export type FloatButtonAxis = 'x' | 'y';

// 相对边界区域左上角的位置（px）
export interface FloatButtonOffset {
	x: number;
	y: number;
}

export const props = {
	/**
	 * 拖动方向：true 自由拖动，'x' / 'y' 只沿该方向拖动，false 不可拖动
	 */
	draggable: {
		type: [Boolean, String] as PropType<boolean | FloatButtonAxis>,
		default: 'y'
	},
	/**
	 * 松开后吸边：'x' 吸到左右两边中较近的一边，'y' 吸到上下两边中较近的一边，true 吸到四边中最近的一边
	 */
	magnetic: {
		type: [Boolean, String] as PropType<boolean | FloatButtonAxis>,
		default: false
	},
	/**
	 * 位置（v-model:offset）：按钮左上角相对边界区域左上角的距离（px），超出边界时限制在边界内
	 * 不传时停在右下角
	 */
	offset: {
		type: Object as PropType<FloatButtonOffset>
	},
	/**
	 * 与边界的最小间距，数组为 [左右, 上下]：数字在 FloatButton 中为 px（默认 24）、在 MFloatButton 中为 750 稿长度（默认 48）
	 * 边界区域为所在滚动容器的可视区（页面滚动时为视口），并避开安全区
	 */
	gap: {
		type: [Number, Array] as PropType<number | [number, number]>
	},
	// 图标类型，同 Icon 的 type；默认插槽可替换内容
	icon: String,
	/**
	 * 形状：circle 为圆形，square 为圆角方形
	 */
	shape: {
		type: String as PropType<'circle' | 'square'>,
		default: 'circle'
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
