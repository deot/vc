import type { ExtractPropTypes, StyleValue, PropType } from 'vue';
import { pick } from 'lodash-es';
import { props as barProps } from './scroller-bar/bar-props';

const barKeys = [
	'always',
	'thumbMinSize',
	'thumbStyle',
	'thumbClass',
	'trackStyle',
	'trackClass',
	'trackOffsetX',
	'trackOffsetY',
	'autoResize',
	'native'
] as const;

export const props = {
	tag: {
		type: String,
		default: 'div',
	},
	height: {
		type: [String, Number],
		default: '',
	},
	maxHeight: {
		type: [String, Number],
		default: '',
	},
	wrapperStyle: {
		type: [String, Array, Object] as PropType<StyleValue>,
		default: '',
	},
	wrapperClass: {
		type: [String, Array, Object] as PropType<StyleValue>,
		default: '',
	},
	contentStyle: {
		type: [String, Array, Object] as PropType<StyleValue>,
		default: '',
	},
	contentClass: {
		type: [String, Array, Object] as PropType<StyleValue>,
		default: '',
	},
	showBar: {
		type: Boolean,
		default: true
	},
	// 只在该方向滚动：另一方向不可滚动，滚轮的纵横增量都用于该方向（触摸为原生滚动）；不设置时两个方向都可滚动
	axis: {
		type: String as PropType<'x' | 'y'>,
		validator: (v: string) => /^(x|y)$/.test(v)
	},
	// 由滚轮驱动滚动（见 use-wheel）；native=true 时不生效
	wheel: {
		type: Boolean,
		default: false
	},
	// 滚轮驱动时，被接管的滚轮事件是否停止冒泡
	stopPropagation: {
		type: Boolean,
		default: true
	},
	barTo: barProps.to,
	barTriggerElement: barProps.trigger,
	...(pick(barProps, barKeys) as Pick<typeof barProps, typeof barKeys[number]>)
};
export type Props = ExtractPropTypes<typeof props>;
