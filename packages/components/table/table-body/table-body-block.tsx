/** @jsxImportSource vue */

import { defineComponent, inject, Fragment } from 'vue';
import { TableGrid } from '../table-grid';
import { TableExpand } from './table-expand';
import { getRowValue, getRowHeight } from '../utils';
import { useMeasuring } from '../../measuring';
import type { TableProvide } from '../types';
import type { TableColumnStates } from '../table-column/table-column-node';

type RowData = Record<string, unknown>;

// 块内的行条目，见 Block#buildInitialList
type BlockRow = { index: number; data: RowData; level?: number };

// ---------------------------------------------------------------------
// 样式与类名
// ---------------------------------------------------------------------
// 以下取值每格都要用：props 由块在渲染开头读一次后传入，不在每格里重复经响应式代理读取
type CellProps = Pick<TableProvide['props'], 'cellStyle' | 'cellClass'>;

const getCellStyle = (cellStyle: CellProps['cellStyle'], rowIndex: number, columnIndex: number, row: RowData, column: TableColumnStates) => {
	if (typeof cellStyle === 'function') {
		return cellStyle.call(null, { rowIndex, columnIndex, row, column });
	}
	// 没有表级样式时直接用列样式，不必每格新建对象
	return cellStyle ? { ...cellStyle, ...column.style } : column.style;
};

const getCellClass = (cellClass: CellProps['cellClass'], rowIndex: number, columnIndex: number, row: RowData, column: TableColumnStates) => {
	const classes = [column.realAlign, column.class, column.stickyClass];

	if (typeof cellClass === 'string') {
		classes.push(cellClass);
	} else if (typeof cellClass === 'function') {
		classes.push(cellClass.call(null, { rowIndex, columnIndex, row, column }));
	}

	return classes.join(' ');
};

// 内部行态按行求值，统一挂到该行的 cell 上；level 仅树形表格传入
const getInternalCellClass = (table: TableProvide, row: RowData, rowIndex: number, level: number | null, expanded: boolean) => {
	const classes: string[] = [];
	if (level !== null) {
		classes.push(`vc-table__row--level-${level}`);
	}
	// 未开启 highlight 时不读 currentRow：选中行变化不会让所有块重渲染
	if (table.props.highlight && row === table.store.states.currentRow) {
		classes.push('current-row');
	}
	if (table.props.stripe && rowIndex % 2 === 1) {
		classes.push('vc-table__row--striped', 'is-striped');
	}
	if (expanded) {
		classes.push('expanded');
	}
	return classes;
};

const getAriaExpanded = (table: TableProvide, row: BlockRow, expanded: boolean) => {
	const { tree } = table.store;
	const id = tree.isTree ? tree.getKey(row.data) : void 0;
	if (id != null && tree.nodes[id]) return tree.isExpanded(id);
	return table.store.states.expandColumn ? expanded : void 0;
};

const getUserRowClass = (table: TableProvide, row: RowData, rowIndex: number) => {
	const { rowClass } = table.props;
	if (typeof rowClass === 'string') {
		return rowClass;
	}
	if (typeof rowClass === 'function') {
		return rowClass.call(null, { row, rowIndex });
	}
	return '';
};

const getUserRowStyle = (table: TableProvide, row: RowData, rowIndex: number) => {
	const { rowStyle } = table.props;
	if (typeof rowStyle === 'function') {
		return rowStyle.call(null, { row, rowIndex });
	}
	return rowStyle || null;
};

/**
 * 块渲染（虚拟化最小单位）：
 * 	- 单行块（无合并，绝大多数场景）：容器即 `vc-table__tr`（行语义 + grid 容器 + cells 直接父级）；
 * 	- 多行合并块：容器为 `vc-table__tr-group`；用户 row-class/row-style 无效；
 * 	- stripe / highlight / expand / 树形层级等内部行态统一挂 cell；用户 row-class/row-style 仍仅挂单行块 `vc-table__tr`；
 * 	- 只负责渲染：cells 只带 data-row / data-column，事件、悬停高亮与省略提示由 TableBody 在表体根节点统一处理；
 * 	- 展开行以 `<TableGrid /> + <TableExpand />` 兄弟结构渲染在块内。
 */
export const TableBodyBlock = defineComponent({
	name: 'vc-table-body-block',
	props: {
		store: { type: Object, required: true }
	},
	setup(props) {
		const table = inject<TableProvide>('vc-table')!;
		// 虚拟列表测量池里的块只用来量尺寸，不参与拖拽与悬停的块查找
		const measuring = useMeasuring();

		return () => {
			const block = props.store;
			// 直接读 store（本身是响应式的）：不必每个块各建一组 computed
			const { columns, expandColumn, treeColumnIndex } = table.store.states;
			const rows = block.rows;
			const isSingleRow = rows.length === 1;
			const maxColumnIndex = columns.length - 1;
			const rowStart = block.rowStart;

			// cells 由 store 懒构建（仅发生在可见块上）：合并块查合并计划，普通块合成 1×1
			const layoutCells = table.store.block.getCells(block);

			// 选中、展开、层级按行求值；用户 row-class/row-style 仅单行块挂 tr，合并块无效
			const isTree = table.store.tree.isTree;
			const { primaryKey, cellStyle, cellClass, rowHeight } = table.props;
			const rowStates = rows.map((row: BlockRow) => {
				const { data, index } = row;
				const level = row.level || 0;
				const expanded = !!expandColumn && table.store.expand.isExpanded(data);
				return {
					data,
					// 行的 key：每行算一次，该行的格子共用
					key: primaryKey ? getRowValue(data, primaryKey) : index,
					level,
					expanded,
					selected: table.store.selection.isSelected(data),
					class: getInternalCellClass(table, data, index, isTree ? level : null, expanded)
				};
			});
			const singleRow = isSingleRow ? rows[0] : null;
			const singleState = isSingleRow ? rowStates[0] : null;

			type LayoutCell = { rowIndex: number; columnIndex: number; rowspan: number; colspan: number };
			const cells = layoutCells.reduce((pre: Record<string, unknown>[], cell: LayoutCell) => {
				const rowState = rowStates[cell.rowIndex - rowStart];
				const columnNode = columns[cell.columnIndex];
				if (!rowState || !columnNode) return pre;
				const column = columnNode.states;
				const row = rowState.data;

				pre.push({
					key: `${rowState.key}-${column.id}`,
					rowIndex: cell.rowIndex,
					columnIndex: cell.columnIndex,
					rowspan: cell.rowspan,
					colspan: cell.colspan,
					class: [
						rowState.class,
						getCellClass(cellClass, cell.rowIndex, cell.columnIndex, row, column),
						'vc-table__td'
					],
					style: [
						getCellStyle(cellStyle, cell.rowIndex, cell.columnIndex, row, column),
						column.stickyStyle
					],
					attrs: {
						'data-row': cell.rowIndex,
						'data-column': cell.columnIndex
					},
					render: () => column.renderCell!({
						row,
						rowIndex: cell.rowIndex,
						column,
						columnIndex: cell.columnIndex,
						selected: rowState.selected,
						store: table.store,
						level: rowState.level,
						// 树形列：缩进、展开图标与加载状态
						treeNode: isTree && cell.columnIndex === treeColumnIndex
							? table.store.tree.getTreeNode(row, rowState.level)
							: void 0,
						isHead: cell.columnIndex === 0,
						isTail: cell.columnIndex + (cell.colspan || 1) - 1 === maxColumnIndex
					})
				});
				return pre;
			}, []);

			const grid = (
				<TableGrid
					class={[
						isSingleRow ? 'vc-table__tr' : 'vc-table__tr-group',
						isSingleRow && getUserRowClass(table, singleRow!.data, singleRow!.index),
						{
							// 拖拽排序中被拖动的块（标记写在块上，拖拽开始 / 结束只有该块重渲染）
							'is-dragging': !!block.dragging,
							// 整行拖拽（无把手列时）：整行 move 光标
							'is-draggable': table.store.drag.rowCursor.value
						}
					]}
					style={isSingleRow ? getUserRowStyle(table, singleRow!.data, singleRow!.index) : null}
					data-row={isSingleRow ? rowStart : void 0}
					// 块的起始行号：拖拽排序与悬停高亮按块命中（测量池里的块不带）
					data-row-start={measuring ? void 0 : rowStart}
					role={isSingleRow ? 'row' : 'rowgroup'}
					cellRole={isTree ? 'gridcell' : 'cell'}
					// 无障碍：树形行的层级，以及可展开行的展开状态（树节点优先，其次为展开行）
					aria-level={singleState && isTree ? singleState.level + 1 : void 0}
					aria-expanded={singleRow ? getAriaExpanded(table, singleRow, singleState!.expanded) : void 0}
					columns={columns}
					rowStart={rowStart}
					// 行高是函数时逐行给出（合并块里各行可以不等高）
					rowHeight={typeof rowHeight === 'function'
						? rows.map((row: BlockRow) => getRowHeight(rowHeight, row.data, row.index))
						: rowHeight}
					cells={cells}
				/>
			);

			// 展开行仅支持单行块（多行合并块内的展开行语义未定义，留作扩展点：
			// 可用 colspan = 全列的附加 grid 行实现块内展开）
			const renderExpand = isSingleRow ? expandColumn?.states.renderExpand : void 0;
			const expandedRows = renderExpand
				? rows.filter((_: BlockRow, index: number) => rowStates[index].expanded)
				: [];

			// 根节点结构保持不变：展开 / 收起只增删展开内容，grid 原地更新，cell 不会被重建
			return (
				<Fragment>
					{ grid }
					{ renderExpand && expandedRows.length > 0 && <TableExpand rows={expandedRows} render={renderExpand} /> }
				</Fragment>
			);
		};
	}
});
