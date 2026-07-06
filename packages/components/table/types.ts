import type { ComputedRef, Ref, VNodeChild } from 'vue';
import type { Nullable } from '@deot/helper-shared';
import type { Store } from './store/store';
import type { Props as TableProps } from './table-props';
import type { TableColumnNode, TableColumnRenderData, TableColumnStates } from './table-column/table-column-node';

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
	renderExpand: Ref<Nullable<(data: Pick<TableColumnRenderData, 'row' | 'rowIndex' | 'store'>) => VNodeChild>>;
	hiddenColumns: Ref<Nullable<HTMLElement>>;
	isReady: Ref<boolean>;
	hoverState: Ref<Nullable<{ cell: HTMLElement; column: TableColumnStates; row: Record<string, unknown> }>>;
	resizeProxyVisible: Ref<boolean>;
	resizeProxy: Ref<Nullable<HTMLElement>>;
	tableWrapper: Ref<Nullable<HTMLElement>>;
}
