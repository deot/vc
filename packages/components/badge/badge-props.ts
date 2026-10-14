import type { ExtractPropTypes, PropType } from 'vue';
import { valueType } from '../customer/customer-props';

export const BADGE_STATUSES = ['default', 'pending', 'success', 'warning', 'error'] as const;

export type BadgeStatus = typeof BADGE_STATUSES[number];

export const props = {
	/**
	 * 徽标内容：数字小于等于0时隐藏，超过max显示为`${max}+`；字符串原样显示，空字符串隐藏
	 */
	value: [Number, String],
	/**
	 * 数字的最大显示值，0表示不限
	 */
	max: {
		type: Number,
		default: 99
	},
	/**
	 * 显示为小圆点，value为小于等于0的数字时隐藏
	 */
	dot: {
		type: Boolean,
		default: false
	},
	/**
	 * 状态点；设置status或label时显示为状态点
	 */
	status: {
		type: String as PropType<BadgeStatus>,
		validator(val: BadgeStatus): boolean {
			return BADGE_STATUSES.indexOf(val) !== -1;
		}
	},
	/**
	 * 状态点旁的文字
	 */
	label: valueType,
	/**
	 * 徽标的颜色，任意CSS颜色
	 */
	color: String,
	/**
	 * 徽标的偏移 [水平, 垂直]，正值向右、向下；数字表示两个方向相同
	 */
	offset: [Number, Array] as PropType<number | number[]>,
	/**
	 * 徽标元素（数字、文字、圆点、自定义、状态点）的类名与样式
	 */
	dotClass: [String, Object, Array],
	dotStyle: [Object, String]
};
export type Props = ExtractPropTypes<typeof props>;
