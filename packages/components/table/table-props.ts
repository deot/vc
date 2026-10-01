import type { ExtractPropTypes, PropType } from 'vue';
import type { TableColumnSyncItem } from './store/modules/column';
import type { TableAllowDragPayload, TableAllowDropPayload } from './types';
import type { TableRowHeight } from './utils';
import type { Props as RecycleListProps } from '../recycle-list/recycle-list-props';

// Table 自己要用到的 RecycleList 属性（以及 style、class 和事件）：recycleListOptions 里的同名项被忽略
export const RECYCLE_LIST_RESERVED_KEYS = [
	'data',
	'store',
	'disabled',
	'fill',
	'vertical',
	'inverted',
	'cols',
	'gutter',
	'pullable',
	'loadData',
	'lazyTail',
	'scrollerOptions',
	'estimateSize',
	'style',
	'class'
] as const;

export const props = {
	data: {
		type: Array,
		default: () => ([]),
	},
	width: [String, Number],
	height: [String, Number],
	maxHeight: [String, Number],
	virtualized: {
		type: Boolean,
		default: false
	},
	// 延迟展示 append slot，直到数据全部进入虚拟列表；普通表格一次渲染完，视为已到末尾
	lazyTail: {
		type: Boolean,
		default: false
	},
	// 行高：固定值，或按行给出的函数（返回 undefined 的行由内容撑开）；虚拟化时每行尺寸按它直接算出，跳过隐藏测量并一次构建全部行
	rowHeight: [String, Number, Function] as PropType<TableRowHeight>,
	// 透传给内部 RecycleList 的属性（仅 height 或 virtualized 走虚拟列表时生效），Table 自己要用的键被忽略
	recycleListOptions: Object as PropType<Partial<Omit<RecycleListProps, typeof RECYCLE_LIST_RESERVED_KEYS[number]>>>,
	// 列的宽度是否自撑开
	fit: {
		type: Boolean,
		default: true
	},
	// 尺寸：调整字号与单元格上下内边距
	size: {
		type: String as PropType<'large' | 'medium' | 'small' | 'mini'>,
		default: 'medium'
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
	// 树形数据的子节点是否懒加载（配合 loadExpand）
	lazyTree: Boolean,
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
	},
	/**
	 * 拖拽排序：[整行拖拽, 列拖拽]，true 等于 [true, false]。
	 * 整行拖拽按住行内任意位置拖动（以块为单位，getSpan 纵向合并的行整体移动），只从把手拖动时使用 type="drag" 的列（不受第一项影响），
	 * 新顺序经 update:data 发出，配合 v-model:data 使用；列拖拽拖动表头，新顺序在表格内部生效并经 update:columns 发出
	 */
	draggable: {
		type: [Boolean, Array] as PropType<boolean | [boolean, boolean]>,
		default: false
	},
	// 块 / 列能否被拖动（type 区分）
	allowDrag: Function as PropType<(data: TableAllowDragPayload) => boolean>,
	// 能否放到落点（type 区分块与列）
	allowDrop: Function as PropType<(data: TableAllowDropPayload) => boolean>
};
export type Props = ExtractPropTypes<typeof props>;
export type TableProps = Props;
