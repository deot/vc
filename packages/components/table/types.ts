import type { ComputedRef, Ref } from 'vue';
import type { Nullable } from '@deot/helper-shared';
import type { Store } from './store/store';
import type { Props as TableProps } from './table-props';
import type { TableColumnNode, TableColumnStates } from './table-column/table-column-node';
import type { TableColumnDropPosition, TableDropPlace, TableDropPosition } from './store/modules/drag';
import type { TableColumnSyncItem } from './store/modules/column';

/**
 * vc-table-column provide 的上下文（多级表头时子列消费）。
 */
export interface TableColumnProvide {
	columnId: ComputedRef<string>;
	columnNode: TableColumnNode;
}

/**
 * vc-table provide 的上下文（即 table.tsx 的 exposed）。
 * 仅声明列路径消费到的字段，其余字段按需补充。
 */
export interface TableProvide {
	tableId: string;
	store: Store;
	props: TableProps;
	emit: (event: string, ...args: unknown[]) => void;
	hiddenColumns: Ref<Nullable<HTMLElement>>;
	isReady: Ref<boolean>;
	resizeProxyVisible: Ref<boolean>;
	resizeProxy: Ref<Nullable<HTMLElement>>;
	tableWrapper: Ref<Nullable<HTMLElement>>;
}

/**
 * 拖拽排序：block-dragstart 的参数
 */
export interface TableBlockDragPayload {
	// 被拖动块的行（普通表格长度为 1，getSpan 纵向合并的块为多行）
	rows: any[];
	// 块首行的行号
	rowIndex: number;
}

/**
 * 拖拽排序：block-dragend 的参数
 */
export interface TableBlockDragEndPayload extends TableBlockDragPayload {
	// 是否按新顺序放下（取消、落点不变、不允许放置时为 false）
	dropped: boolean;
}

/**
 * 拖拽排序：block-drop 的参数
 */
export interface TableBlockDropPayload {
	rows: any[];
	// 落点行：非树形表格为落点块的行；树形表格为 before / after 所相对的行，inner 时为新的父行
	targetRows: any[];
	// 相对落点行的位置；inner（成为子行）仅树形表格
	position: TableDropPosition;
	// 移动前 / 后的位置：parent 为 null 表示根级；index 非树形表格为块首行在 data 中的下标，树形表格为在兄弟行中的下标
	from: TableDropPlace;
	to: TableDropPlace;
	// 新的 data（与 update:data 相同），元素为外部数组中存放的原始行；树形表格为原地修改后根数组的副本
	rawData: any[];
}

/**
 * cell-mouseenter / cell-mouseleave / cell-click / cell-dblclick / cell-contextmenu 与
 * row-click / row-dblclick / row-contextmenu 的参数（同一次操作的单元格事件与行事件为同一个对象）
 */
export interface TableCellEventPayload {
	row: any;
	// 行号（树形表格为可见行的下标），与 getSpan / cellClass 的 rowIndex 一致
	rowIndex: number;
	column: TableColumnStates;
	columnIndex: number;
	// 单元格元素
	cell: HTMLElement;
	event: MouseEvent;
}

/**
 * header-click / header-contextmenu 的参数
 */
export interface TableHeaderEventPayload {
	column: TableColumnStates;
	event: MouseEvent;
}

/**
 * select 的参数
 */
export interface TableSelectPayload {
	row: any;
	// 勾选后该行是否选中
	selected: boolean;
	selection: any[];
}

/**
 * select-all 的参数
 */
export interface TableSelectAllPayload {
	// 全选（true）或取消全选（false）
	selected: boolean;
	selection: any[];
}

/**
 * selection-change 的参数
 */
export interface TableSelectionChangePayload {
	selection: any[];
}

/**
 * current-change 的参数
 */
export interface TableCurrentChangePayload {
	row: any;
	oldRow: any;
}

/**
 * column-resize 的参数：拖动表头边缘改变列宽后触发
 */
export interface TableColumnResizePayload {
	column: TableColumnStates;
	width: number;
	oldWidth: number;
}

/**
 * expand-change 的参数：type 区分展开行（type="expand" 列）与树形节点
 */
export type TableExpandChangePayload = {
	type: 'expand';
	row: any;
	expanded: boolean;
	// 当前已展开的行，按渲染顺序
	expandedRows: any[];
} | {
	type: 'tree';
	row: any;
	expanded: boolean;
	// 当前可见行的最大层级（根为 0）
	maxLevel: number;
};

/**
 * 列拖拽：column-dragstart 的参数
 */
export interface TableColumnDragPayload {
	// 被拖动的列；拖动分组表头时为分组本身
	column: TableColumnStates;
	// 列（分组时为它的第一个可见叶子）在可见叶子列中的下标，与 cell 事件的 columnIndex 一致
	columnIndex: number;
}

/**
 * 列拖拽：column-dragend 的参数
 */
export interface TableColumnDragEndPayload extends TableColumnDragPayload {
	// 是否按新顺序放下（取消、落点不变、不允许放置时为 false）
	dropped: boolean;
}

/**
 * 列的位置：parent 为父分组，顶层为 null；index 为兄弟列（含隐藏列）中的下标
 */
export interface TableColumnDropPlace {
	parent: Nullable<TableColumnStates>;
	index: number;
}

/**
 * 列拖拽：column-drop 的参数
 */
export interface TableColumnDropPayload {
	column: TableColumnStates;
	// 落点列：与被拖列同一父级
	targetColumn: TableColumnStates;
	position: TableColumnDropPosition;
	// 移动前 / 后的位置，to.index 为移除被拖列之后的下标
	from: TableColumnDropPlace;
	to: TableColumnDropPlace;
	// 新的扁平列表（与 update:columns 相同）
	columns: TableColumnSyncItem[];
}

/**
 * allowDrag 的参数：type 区分行（块）与列
 */
export type TableAllowDragPayload = ({ type: 'block' } & TableBlockDragPayload) | ({ type: 'column' } & TableColumnDragPayload);

/**
 * allowDrop 的参数：type 区分行（块）与列
 */
export type TableAllowDropPayload = ({ type: 'block' } & Pick<TableBlockDropPayload, 'rows' | 'targetRows' | 'position' | 'from' | 'to'>)
	| ({ type: 'column' } & Omit<TableColumnDropPayload, 'columns'>);
