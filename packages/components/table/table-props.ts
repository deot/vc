import type { ExtractPropTypes, PropType } from 'vue';
import type { TableColumnSyncItem } from './store/modules/column';

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
	// 是否分割线
	divider: Boolean,
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
		default: '-'
	},
	/**
	 * 排序全部交给外部处理，内部不处理数据，只做交互
	 * 列与列之间互斥
	 */
	sort: {
		type: Object,
		default: () => ({})
	},

	// 用于延迟渲染，用于计算高度
	delay: Number,
	resizable: {
		type: Boolean,
		default: void 0
	},
	/**
	 * 流式高度下（未设置 height/max-height）表头吸顶、合计行吸底
	 * boolean 时同时作用于表头与合计行；
	 * array 为 [top, bottom]，每项可为 boolean 或 affix 配置对象；
	 * object 时同时作用于两端
	 */
	affix: {
		type: [Boolean, Array, Object],
		default: false
	},
	/**
	 * v-model:columns
	 * 暴露内部收集到的全部 leaf 列；外部可按 id 反向重排，
	 * 并通过每项的 hidden 字段控制该列是否渲染（不影响收集）。
	 */
	columns: {
		type: Array as PropType<TableColumnSyncItem[]>,
		default: () => ([])
	}
};
export type Props = ExtractPropTypes<typeof props>;
export type TableProps = Props;
