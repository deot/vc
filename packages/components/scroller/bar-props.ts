import type { ExtractPropTypes, StyleValue, PropType } from 'vue';
import { pick } from 'lodash-es';
import { props as barProps } from './track-props';
import { getScrollBarWidth } from './utils';

const barKeys = [
	'always',
	'thumbMinSize',
	'thumbStyle',
	'thumbClass'
] as const;

export const props = {
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

	// 轨道挂载的目标：CSS selector 或元素
	to: [String, Object] as PropType<string | HTMLElement>,
	// 悬停时显示轨道的区域（CSS selector），默认为轨道所在的容器
	trigger: String,
	trackStyle: [Object, String, Array] as PropType<StyleValue>,
	trackClass: [Object, String, Array] as PropType<StyleValue>,
	wrapperW: Number,
	wrapperH: Number,
	// 滚动容器的 padding [上, 右, 下, 左]，仅 sticky 使用
	wrapperPadding: {
		type: Array as PropType<number[]>,
		default: () => ([0, 0, 0, 0])
	},
	contentH: Number,
	contentW: Number,
	scrollX: Number,
	scrollY: Number,
	// 轨道固定在可视区的方式
	// default: 轨道所在容器不随内容滚动，absolute 定位即可（Scroller、barTo 的目标容器）
	// sticky: 轨道是滚动容器的直接子元素，由 position: sticky 固定
	// translate: 轨道 absolute 定位在滚动容器内，滚动后用 transform 补偿位移
	// 传 to 时轨道已移出滚动容器，始终按 default 处理
	mode: {
		type: String as PropType<'default' | 'sticky' | 'translate'>,
		default: 'default'
	},
	...(pick(barProps, barKeys) as Pick<typeof barProps, typeof barKeys[number]>)
};
export type Props = ExtractPropTypes<typeof props>;
