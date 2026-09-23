import type { ExtractPropTypes, PropType } from 'vue';
import type { TableColumnStates } from './table-column-node';
import type { TableFilterOptions } from '../table-header/table-filter';

export const tableColumnProps = {
	type: {
		type: String,
		default: 'default'
	},
	line: Number,
	// 表头文本行数：不设 default，未设置时取全局配置，再兜底为 1
	headerLine: Number,
	label: String,
	labelClass: String,
	prop: String,
	// 数字或 '120' / '120px'
	width: [String, Number],
	minWidth: [String, Number],
	renderHeader: Function as PropType<TableColumnStates['renderHeader']>,
	resizable: {
		type: Boolean,
		default: true
	},
	align: String,
	headerAlign: String,
	fixed: [Boolean, String] as PropType<boolean | string>,
	formatter: Function as PropType<TableColumnStates['formatter']>,
	selectable: Function as PropType<TableColumnStates['selectable']>,
	reserveSelection: Boolean,
	index: [Number, Function] as PropType<number | ((rowIndex: number) => number)>,
	// 头部是否展示排序
	sortable: Boolean,
	// 表头筛选：原样传给 TableFilter（data / max / icon / portalClass / modelValue / onChange 等）
	filterOptions: Object as PropType<TableFilterOptions>,

	tooltip: [String, Function] as PropType<TableColumnStates['tooltip']>
};

export type TableColumnProps = ExtractPropTypes<typeof tableColumnProps>;
