import type { ExtractPropTypes, PropType } from 'vue';

export type IntersectionOffset = number | string | Array<number | string>;

export const props = {
	tag: {
		type: String,
		default: 'div'
	},
	/**
	 * 是否在可视区：只读，供 v-model 同步，传入的值不影响判断
	 */
	modelValue: {
		type: Boolean,
		default: false
	},
	/**
	 * 可视区四边的扩展量：正数提前（预加载）、负数收缩；1 – 4 个值，顺序同 CSS margin
	 * 数字在 Intersection 中为 px、在 MIntersection 中为 750 稿长度；字符串支持 px / %
	 */
	offset: {
		type: [Number, String, Array] as PropType<IntersectionOffset>,
		default: 0
	},
	// 露出比例达到该值才算可见，[0, 1]；0 为贴边即可见
	threshold: {
		type: Number,
		default: 0
	},
	// 首次可见后停止监听，之后保持可见
	once: {
		type: Boolean,
		default: false
	},
	// 暂停监听，恢复后重新判断
	disabled: {
		type: Boolean,
		default: false
	}
};

export type Props = ExtractPropTypes<typeof props>;
