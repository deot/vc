import type { ComputedRef, Ref } from 'vue';
import type { Nullable } from '@deot/helper-shared';
import type { Store } from './store/store';
import type { Props as TableProps } from './table-props';
import type { TableColumnNode } from './table-column/table-column-node';
import type { TableDropPosition } from './store/modules/drag';

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
 * 拖拽排序：block-drag-start 的参数
 */
export interface TableBlockDragPayload {
	// 被拖动块的行（普通表格长度为 1，getSpan 纵向合并的块为多行）
	rows: any[];
	// 块首行的行号
	rowIndex: number;
}

/**
 * 拖拽排序：block-drag-end 的参数
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
	// 落点块的行
	targetRows: any[];
	// 相对落点块的位置
	position: TableDropPosition;
	// 被拖动块首行在 data 中移动前 / 后的下标
	oldIndex: number;
	newIndex: number;
	// 新的 data（与 update:data 相同），元素为外部数组中存放的原始行
	rawData: any[];
}
