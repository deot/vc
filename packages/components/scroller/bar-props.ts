import type { ExtractPropTypes, StyleValue, PropType } from 'vue';
import { pick } from 'lodash-es';
import { props as barProps } from './track-props';
import { getScrollBarWidth } from './utils';

const barKeys = [
	'always',
	'thumbMinSize',
	'thumbStyle',
	'thumbClassName'
] as const;

export const props = {
	wrapper: Object as PropType<HTMLElement>,
	content: Object as PropType<HTMLElement>,
	// 默认情况：
	// 	如果存在滚动条宽度为false, 不存在则为true
	// 	为false的情况下才能使用track-offset
	native: {
		type: Boolean,
		default: !getScrollBarWidth(),
	},
	autoResize: {
		type: Boolean,
		default: true
	},
	// 基于原位置，偏移值（上下左右），top不会作用，left负数代表意味wrapperSize会变长
	trackOffsetX: {
		type: Array as PropType<number[]>,
		default: () => ([0, 0, 0, 0])
	},

	// 基于原位置，偏移值（上下左右），right不会作用，bottom负数代表意味wrapperSize会变长
	trackOffsetY: {
		type: Array as PropType<number[]>,
		default: () => ([0, 0, 0, 0])
	},

	to: String,
	trackStyle: [Object, String, Array] as PropType<StyleValue>,
	trackClassName: [Object, String, Array] as PropType<StyleValue>,
	...(pick(barProps, barKeys) as Pick<typeof barProps, typeof barKeys[number]>)
};
export type Props = ExtractPropTypes<typeof props>;
