import type { ExtractPropTypes, PropType } from 'vue';
import { valueType } from '../customer/customer-props';
import type { GridResponsive, GridColumns, GridSpan, GridSpanResult } from '../grid/types';
import type {
	DescriptionsOption,
	DescriptionsTheme,
	DescriptionsSize,
	DescriptionsLabelPosition,
	DescriptionsContext
} from './types';

const THEMES = ['fill', 'inverted', 'plain', 'border'] as const;
const SIZES = ['mini', 'small', 'medium', 'large'] as const;
const LABEL_POSITIONS = ['left', 'right', 'top'] as const;

export const props = {
	/**
	 * 数据源，每项通过prop路径取值
	 */
	data: {
		type: Object as PropType<Record<string, any>>,
		default: () => ({})
	},
	/**
	 * 配置写法：项，或分组 { label, children }
	 */
	options: {
		type: Array as PropType<DescriptionsOption[]>,
		default: () => ([])
	},
	title: valueType,
	theme: {
		type: String as PropType<DescriptionsTheme>,
		default: 'fill',
		validator: (v: string) => THEMES.includes(v as any)
	},
	size: {
		type: String as PropType<DescriptionsSize>,
		default: 'medium',
		validator: (v: string) => SIZES.includes(v as any)
	},
	/**
	 * 同Grid：数字为等宽列数，也支持轨道模板
	 */
	columns: {
		type: [Number, String, Array, Object] as PropType<GridResponsive<GridColumns>>,
		default: 24
	},
	/**
	 * 所有项的默认span；未设置时为轨道数的1/3
	 */
	span: [Number, String, Object] as PropType<GridResponsive<GridSpan>>,
	labelPosition: {
		type: String as PropType<DescriptionsLabelPosition>,
		default: 'left',
		validator: (v: string) => LABEL_POSITIONS.includes(v as any)
	},
	/**
	 * 标签宽度（px）；auto时同一列的标签取其中最宽的
	 */
	labelWidth: [Number, String] as PropType<number | 'auto'>,
	/**
	 * 标签和值在同一单元格内按文字流排列
	 */
	inline: {
		type: Boolean,
		default: false
	},
	/**
	 * 标签后的冒号：left / right且主题不是border时显示；字符串可自定义
	 */
	colon: {
		type: [Boolean, String],
		default: true
	},
	/**
	 * 值为空（null / undefined / '' / []）时显示
	 */
	placeholder: {
		type: valueType,
		default: '-'
	},
	/**
	 * 同Table：返回 [rowspan, colspan] 或 { rowspan, colspan }；colspan覆盖span，任一为0时隐藏
	 */
	getSpan: Function as PropType<(context: DescriptionsContext) => GridSpanResult>,
	labelClass: [String, Object, Array],
	labelStyle: [String, Object, Array],
	contentClass: [String, Object, Array],
	contentStyle: [String, Object, Array]
};
export type Props = ExtractPropTypes<typeof props>;
