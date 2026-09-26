/** @jsxImportSource vue */

import { defineComponent, inject, onBeforeUnmount, Fragment } from 'vue';
import type { Nullable } from '@deot/helper-shared';
import { debounce } from 'lodash-es';
import { useStates } from '../store';
import { TableGrid } from '../table-grid';
import { TableExpand } from './table-expand';
import { getRowValue } from '../utils';
import { getColumnLine } from '../table-column/table-column-config';
import { useTextLineTooltip } from '../hooks/use-text-line-tooltip';
import type { TableProvide } from '../types';
import type { TableColumnStates } from '../table-column/table-column-node';

type RowData = Record<string, unknown>;

// 块内的行条目，见 Block#buildInitialList
type BlockRow = { index: number; data: RowData; level?: number };

type ResolvedCell = {
	cellEl: HTMLElement;
	row: RowData;
	rowIndex: number;
	column: TableColumnStates;
	columnIndex: number;
};

/**
 * 块渲染（虚拟化最小单位）：
 * 	- 单行块（无合并，绝大多数场景）：容器即 `vc-table__tr`（行语义 + grid 容器 + cells 直接父级）；
 * 	- 多行合并块：容器为 `vc-table__tr-group`；用户 row-class/row-style 无效；
 * 	- stripe / highlight / expand / 树形层级等内部行态统一挂 cell；用户 row-class/row-style 仍仅挂单行块 `vc-table__tr`；
 * 	- cell 事件走容器级委托（cells 只带 data-row / data-column，无 per-cell 闭包）；
 * 	- 展开行以 `<TableGrid /> + <TableExpand />` 兄弟结构渲染在块内。
 */
export const TableBodyBlock = defineComponent({
	name: 'vc-table-body-block',
	props: {
		store: { type: Object, required: true }
	},
	setup(props) {
		const table = inject<TableProvide>('vc-table')!;
		const states = useStates({
			columns: 'columns',
			currentRow: 'currentRow',
			expandColumn: 'expandColumn',
			treeColumnIndex: 'treeColumnIndex'
		});

		// ---------------------------------------------------------------------
		// 样式与类名
		// ---------------------------------------------------------------------
		const getValueOfRow = (row: RowData, index: number) => {
			const { primaryKey } = table.props;
			if (primaryKey) {
				return getRowValue(row, primaryKey);
			}
			return index;
		};

		const getCellStyle = (rowIndex: number, columnIndex: number, row: RowData, column: TableColumnStates) => {
			const { cellStyle } = table.props;
			if (typeof cellStyle === 'function') {
				return cellStyle.call(null, { rowIndex, columnIndex, row, column });
			}
			return {
				...cellStyle,
				...column.style
			};
		};

		const getCellClass = (rowIndex: number, columnIndex: number, row: RowData, column: TableColumnStates) => {
			const classes = [column.realAlign, column.class, column.stickyClass];

			const cellClass = table.props.cellClass;
			if (typeof cellClass === 'string') {
				classes.push(cellClass);
			} else if (typeof cellClass === 'function') {
				classes.push(cellClass.call(null, { rowIndex, columnIndex, row, column }));
			}

			return classes.join(' ');
		};

		// 内部行态按行求值，统一挂到该行的 cell 上；level 仅树形表格传入
		const getInternalCellClass = (row: RowData, rowIndex: number, level: number | null, expanded: boolean) => {
			const classes: string[] = [];
			if (level !== null) {
				classes.push(`vc-table__row--level-${level}`);
			}
			if (table.props.highlight && row === states.currentRow) {
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

		const getAriaExpanded = (row: BlockRow, expanded: boolean) => {
			const { tree } = table.store;
			const id = tree.isTree ? tree.getKey(row.data) : void 0;
			if (id != null && tree.nodes[id]) return tree.isExpanded(id);
			return states.expandColumn ? expanded : void 0;
		};

		const getUserRowClass = (row: RowData, rowIndex: number) => {
			const { rowClass } = table.props;
			if (typeof rowClass === 'string') {
				return rowClass;
			}
			if (typeof rowClass === 'function') {
				return rowClass.call(null, { row, rowIndex });
			}
			return '';
		};

		const getUserRowStyle = (row: RowData, rowIndex: number) => {
			const { rowStyle } = table.props;
			if (typeof rowStyle === 'function') {
				return rowStyle.call(null, { row, rowIndex });
			}
			return rowStyle || null;
		};

		// ---------------------------------------------------------------------
		// 容器级事件委托
		// ---------------------------------------------------------------------
		/**
		 * 从事件对象找到所属的 cell 元素
		 *
		 * cells 为 grid 容器的直接子节点：从 target 向上找到 currentTarget 的直接子级即 cell，
		 * 天然屏蔽 cell 内嵌套表格的干扰（嵌套 td 的父级不是本容器）
		 * @param e 委托在容器上的事件
		 * @returns 命中的 cell 元素；事件不落在 cell 上时为 null
		 */
		const resolveCellEl = (e: Event): Nullable<HTMLElement> => {
			const root = e.currentTarget as HTMLElement;
			let node = e.target as Nullable<HTMLElement>;
			while (node && node !== root) {
				if (node.parentElement === root) {
					return node.classList?.contains?.('vc-table__td') ? node : null;
				}
				node = node.parentElement;
			}
			return null;
		};

		const resolveCell = (e: Event): Nullable<ResolvedCell> => {
			const cellEl = resolveCellEl(e);
			if (!cellEl) return null;
			const rowIndex = Number(cellEl.dataset.row);
			const columnIndex = Number(cellEl.dataset.column);
			const row = props.store.rows[rowIndex - props.store.rowStart];
			const columnNode = states.columns[columnIndex];
			if (!row || !columnNode) return null;
			return { cellEl, row: row.data, rowIndex, column: columnNode.states, columnIndex };
		};

		const textLineTooltip = useTextLineTooltip();

		const handleHoverEnter = debounce((index: number) => {
			table.store.row.setHoverIndex(index);
		}, 30);

		const handleHoverLeave = debounce(() => {
			table.store.row.setHoverIndex(null);
		}, 30);

		const enterCell = (e: MouseEvent, cell: ResolvedCell) => {
			handleHoverEnter(cell.rowIndex);
			table.emit('cell-mouse-enter', cell.row, cell.column, cell.cellEl, e);
			// 多行省略被截断时展示完整内容
			textLineTooltip.open(cell.cellEl.querySelector('.vc-table__text-line'), getColumnLine(cell.column, 'line'), cell.cellEl);
		};

		const leaveCell = (e: MouseEvent, cell: ResolvedCell) => {
			table.emit('cell-mouse-leave', cell.row, cell.column, cell.cellEl, e);
		};

		// mouseover 冒泡 + 前后 cell 比较，合成 enter/leave 语义
		let activeCell: Nullable<ResolvedCell> = null;
		const handleMouseOver = (e: MouseEvent) => {
			const cell = resolveCell(e);
			if (activeCell && cell && activeCell.cellEl === cell.cellEl) return;
			if (activeCell) leaveCell(e, activeCell);
			activeCell = cell;
			if (cell) enterCell(e, cell);
		};

		const handleMouseLeave = (e: MouseEvent) => {
			if (activeCell) {
				leaveCell(e, activeCell);
				activeCell = null;
			}
			handleHoverLeave();
		};

		const handleEvent = (e: MouseEvent, name: string) => {
			const cell = resolveCell(e);
			if (!cell) return;
			table.emit(`cell-${name}`, cell.row, cell.column, cell.cellEl, e);
			table.emit(`row-${name}`, cell.row, cell.column, e);
			return cell;
		};

		const handleClick = (e: MouseEvent) => {
			const cell = resolveCell(e);
			if (!cell) return;
			table.store.row.set(cell.row);
			table.emit('cell-click', cell.row, cell.column, cell.cellEl, e);
			table.emit('row-click', cell.row, cell.column, e);
		};

		onBeforeUnmount(() => {
			handleHoverEnter.cancel();
			handleHoverLeave.cancel();
		});

		return () => {
			const block = props.store;
			const columns = states.columns;
			const rows = block.rows;
			const isSingleRow = rows.length === 1;
			const maxColumnIndex = columns.length - 1;
			const rowStart = block.rowStart;

			// cells 由 store 懒构建（仅发生在可见块上）：合并块查合并计划，普通块合成 1×1
			const layoutCells = table.store.block.getCells(block);

			// 选中、展开、层级按行求值；用户 row-class/row-style 仅单行块挂 tr，合并块无效
			const isTree = table.store.tree.isTree;
			const expandColumn = states.expandColumn;
			const rowStates = rows.map((row: BlockRow) => {
				const level = row.level || 0;
				const expanded = !!expandColumn && table.store.expand.isExpanded(row.data);
				return {
					level,
					expanded,
					selected: table.store.selection.isSelected(row.data),
					class: getInternalCellClass(row.data, row.index, isTree ? level : null, expanded)
				};
			});
			const singleRow = isSingleRow ? rows[0] : null;
			const singleState = isSingleRow ? rowStates[0] : null;

			type LayoutCell = { rowIndex: number; columnIndex: number; rowspan: number; colspan: number };
			const cells = layoutCells.reduce((pre: Record<string, unknown>[], cell: LayoutCell) => {
				const rowOffset = cell.rowIndex - rowStart;
				const row = rows[rowOffset];
				const columnNode = columns[cell.columnIndex];
				if (!row || !columnNode) return pre;
				const column = columnNode.states;
				const rowState = rowStates[rowOffset];

				pre.push({
					key: `${getValueOfRow(row.data, row.index)}-${column.id}`,
					rowIndex: cell.rowIndex,
					columnIndex: cell.columnIndex,
					rowspan: cell.rowspan,
					colspan: cell.colspan,
					class: [
						rowState.class,
						getCellClass(cell.rowIndex, cell.columnIndex, row.data, column),
						'vc-table__td'
					],
					style: [
						getCellStyle(cell.rowIndex, cell.columnIndex, row.data, column),
						column.stickyStyle
					],
					attrs: {
						'data-row': cell.rowIndex,
						'data-column': cell.columnIndex
					},
					render: () => column.renderCell!({
						row: row.data,
						rowIndex: cell.rowIndex,
						column,
						columnIndex: cell.columnIndex,
						selected: rowState.selected,
						store: table.store,
						level: rowState.level,
						// 树形列：缩进、展开图标与加载状态
						treeNode: isTree && cell.columnIndex === states.treeColumnIndex
							? table.store.tree.getTreeNode(row.data, rowState.level)
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
						isSingleRow && getUserRowClass(singleRow!.data, singleRow!.index)
					]}
					style={isSingleRow ? getUserRowStyle(singleRow!.data, singleRow!.index) : null}
					data-row={isSingleRow ? rowStart : void 0}
					role={isSingleRow ? 'row' : 'rowgroup'}
					cellRole={isTree ? 'gridcell' : 'cell'}
					// 无障碍：树形行的层级，以及可展开行的展开状态（树节点优先，其次为展开行）
					aria-level={singleState && isTree ? singleState.level + 1 : void 0}
					aria-expanded={singleRow ? getAriaExpanded(singleRow, singleState!.expanded) : void 0}
					columns={columns}
					rowStart={rowStart}
					rowHeight={table.props.rowHeight}
					cells={cells}
					// 容器级事件委托（原生事件经 attrs 透传到 grid 根节点）
					{...({
						onClick: handleClick,
						onDblclick: (e: MouseEvent) => handleEvent(e, 'dblclick'),
						onContextmenu: (e: MouseEvent) => handleEvent(e, 'contextmenu'),
						onMouseover: handleMouseOver,
						onMouseleave: handleMouseLeave
					})}
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
