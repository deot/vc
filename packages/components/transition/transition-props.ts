import type { ExtractPropTypes, PropType } from 'vue';

// 毫秒数，或进入、离开各自的毫秒数
export type Timing = number | { enter?: number; leave?: number };

// 取进入或离开的那一份；对象里没给时为 0
export const timingOf = (value: Timing, phase: 'enter' | 'leave') => (typeof value === 'number' ? value : value[phase] ?? 0);

export const props = {
	/**
	 * 进入/离开持续时间
	 * {enter: 300, leave: 300}
	 */
	duration: {
		type: [Number, Object] as PropType<Timing>,
		default: 300
	},
	/**
	 * 进入/离开延迟时间
	 */
	delay: {
		type: [Number, Object] as PropType<Timing>,
		default: 0
	},
	/**
	 * `transition-group` component.
	 */
	group: Boolean,
	/**
	 * `transition-group` tag, v3版本默认值无
	 */
	tag: {
		type: String,
		default: undefined
	},
	/**
	 *  变换的初始位置, 可以用style代替, 更短~~
	 */
	origin: {
		type: String,
		default: ''
	},
	/**
	 * 在转换期间应用的元素样式。这些样式应用于@beforeEnter和@beforeLeave钩子
	 * inheritAttrs必须是false
	 */
	style: {
		type: Object,
		default: () => {
			return {
				animationFillMode: 'both',
				animationTimingFunction: 'ease-out'
			};
		}
	},
	prefix: {
		type: String,
		default: 'vc-transition'
	},
	mode: {
		type: String,
		default: 'none'
	}
};
export type Props = ExtractPropTypes<typeof props>;
