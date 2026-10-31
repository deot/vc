import type { ExtractPropTypes, PropType } from 'vue';

export type SliderValue = number | number[];
export type SliderTipValue = string | number | null | undefined;
export type SliderTicks = 'none' | 'dot' | 'line';
export type SliderTooltip = 'hover' | 'always' | 'never';
export type SliderTooltipPlacement = 'top' | 'bottom' | 'left' | 'right';
export type SliderMark = string | number | {
	label?: string | number;
	class?: any;
	style?: any;
};

export interface SliderRangeOptions {
	draggable?: boolean;
}

export interface SliderSegment {
	// 段终点；起点是上一段的终点（第一段为 min）
	end: number;
	// 段内步长，默认取 step
	step?: number;
	// 段在轨道上的宽度：0–1 或百分比字符串；未设置的段按值域长度分剩余宽度
	width?: number | string;
}

export const props = {
	modelValue: {
		type: [Number, Array] as PropType<SliderValue>,
		default: 0
	},
	min: {
		type: Number,
		default: 0
	},
	max: {
		type: Number,
		default: 100
	},
	// null：只能落在 marks 上
	step: {
		type: Number as PropType<number | null>,
		default: 1
	},
	segments: Array as PropType<SliderSegment[]>,
	marks: Object as PropType<Record<number, SliderMark>>,
	// 对象时 draggable 为 true 可按住选中条整体平移
	range: {
		type: [Boolean, Object] as PropType<boolean | SliderRangeOptions>,
		default: false
	},
	vertical: {
		type: Boolean,
		default: false
	},
	inverted: {
		type: Boolean,
		default: false
	},
	disabled: {
		type: Boolean,
		default: false
	},
	clickable: {
		type: Boolean,
		default: true
	},
	// 步长刻度：dot 为轨道内圆点，line 为轨道外侧短线（与标签相对的一侧）
	ticks: {
		type: String as PropType<SliderTicks>,
		default: 'none',
		validator: (value: string) => /^(none|dot|line)$/.test(value)
	},
	formatter: {
		type: Function as PropType<(value: number) => SliderTipValue>,
		default: (value: number) => `${value}`
	},
	showInput: {
		type: Boolean,
		default: false
	},
	tooltip: {
		type: String as PropType<SliderTooltip>,
		default: 'hover',
		validator: (value: string) => /^(hover|always|never)$/.test(value)
	},
	// 未设置时水平在上方、垂直在右侧
	tooltipPlacement: {
		type: String as PropType<SliderTooltipPlacement>,
		validator: (value: string) => /^(top|bottom|left|right)$/.test(value)
	}
};
export type Props = ExtractPropTypes<typeof props>;
