import type { ExtractPropTypes, StyleValue, PropType } from 'vue';
import { pick } from 'lodash-es';
import { props as barProps } from './bar-props';
import { getScrollBarWidth } from './utils';

const barKeys = [
	'always',
	'thumbMinSize',
	'thumbStyle',
	'thumbClassName',
	'trackStyle',
	'trackClassName'
] as const;

export const props = {
	height: {
		type: [String, Number],
		default: '',
	},
	maxHeight: {
		type: [String, Number],
		default: '',
	},
	// 默认情况：
	// 	如果存在滚动条宽度为false, 不存在则为true
	// 	为false的情况下才能使用track-offset
	native: {
		type: Boolean,
		default: !getScrollBarWidth(),
	},
	wrapperStyle: {
		type: [String, Array, Object] as PropType<StyleValue>,
		default: '',
	},
	wrapperClassName: {
		type: [String, Array, Object] as PropType<StyleValue>,
		default: '',
	},
	contentStyle: {
		type: [String, Array, Object] as PropType<StyleValue>,
		default: '',
	},
	contentClassName: {
		type: [String, Array, Object] as PropType<StyleValue>,
		default: '',
	},
	autoResize: {
		type: Boolean,
		default: true
	},
	tag: {
		type: String,
		default: 'div',
	},
	
	// 基于原位置，偏移值（上下左右），top不会作用，left负数代表意味wrapperSize会变长
	trackOffsetX: {
		type: Array,
		default: () => ([0, 0, 0, 0])
	},

	// 基于原位置，偏移值（上下左右），right不会作用，bottom负数代表意味wrapperSize会变长
	trackOffsetY: {
		type: Array,
		default: () => ([0, 0, 0, 0])
	},

	barTo: String,
	...(pick(barProps, barKeys) as Pick<typeof barProps, typeof barKeys[number]>)
};
export type Props = ExtractPropTypes<typeof props>;