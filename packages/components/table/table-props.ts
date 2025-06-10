import type { ExtractPropTypes } from 'vue';

export const props = {
	data: {
		type: Array,
		default: () => ([]),
	},
	width: [String, Number],
	height: [String, Number],
	maxHeight: [String, Number],
	rowHeight: [String, Number],
	// 列的宽度是否自撑开
	fit: {
		type: Boolean,
		default: true
	},
	// 是否为斑马纹 table
	stripe: Boolean,
	// 是否带有纵向边框
	border: Boolean,
	// 非常影响表格虚拟滚动的性能，按容器的高度手动优化该值
	// 后续考虑移除，动态计算
	rows: {
		type: Number,
		default: 10
	},
	primaryKey: [String, Function],
	// 是否显示表头
	showHeader: {
		type: Boolean,
		default: true
	},
	showSummary: Boolean,
	sumText: String,
	getSummary: Function,
	rowClass: [String, Function],
	rowStyle: [Object, Function],
	cellClass: [String, Function],
	cellStyle: [Object, Function],
	headerRowClass: [String, Function],
	headerRowStyle: [Object, Function],
	headerCellClass: [String, Function],
	headerCellStyle: [Object, Function],
	// 当前对应的currentRow是否可高亮
	highlight: Boolean,
	// TODO: 支持数组
	currentRowValue: [String, Number],
	emptyText: [String, Function],
	expandRowValue: Array,
	defaultExpandAll: Boolean,
	/**
	 * 在多选表格中，当仅有部分行被选中时，点击表头的多选框时的行为。
	 * 若为 true，则选中所有行；若为 false，则取消选择所有行
	 */
	indeterminate: {
		type: Boolean,
		default: true
	},
	lazy: Boolean,
	// 展示树形数据时，树节点的缩进
	indent: {
		type: Number,
		default: 16
	},
	treeMap: {
		type: Object,
		default: () => {
			return {
				hasChildren: 'hasChildren',
				children: 'children'
			};
		}
	},
	// 树形表格子集是否需要显示选择按钮
	expandSelectable: {
		type: Boolean,
		default: true
	},
	loadExpand: Function,
	getSpan: Function,
	placeholder: {
		type: [String, Function],
		default: '--'
	},
	/**
	 * 排序全部交给外部处理，内部不处理数据，只做交互
	 * 列与列之间互斥
	 */
	defaultSort: {
		type: Object,
		default: () => ({})
	},

	// 用于延迟渲染，用于计算高度
	delay: Number
};
export type Props = ExtractPropTypes<typeof props>;
