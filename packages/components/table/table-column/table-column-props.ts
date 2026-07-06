import type { ExtractPropTypes, PropType } from 'vue';
import type { TableColumnStates } from './table-column-node';

export const tableColumnProps = {
	type: {
		type: String,
		default: 'default'
	},
	line: Number,
	label: String,
	labelClass: String,
	prop: String,
	width: Number,
	minWidth: Number,
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
	// 数据过滤的选项
	filters: Array as PropType<unknown[]>,
	// 是否支持多选
	filterMultiple: {
		type: Boolean,
		default: true
	},
	filterIcon: String,
	// 选中的数据过滤项
	filteredValue: Array as PropType<unknown[]>,
	// 筛选弹层的样式
	filterPopupClass: String,
	// 筛选的方法
	filter: Function as PropType<(value: unknown) => void>,

	tooltip: [String, Function] as PropType<TableColumnStates['tooltip']>
};

export type TableColumnProps = ExtractPropTypes<typeof tableColumnProps>;
