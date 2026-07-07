/** @jsxImportSource vue */

import { defineComponent, inject, onBeforeUnmount, Fragment } from 'vue';
import type { Nullable } from '@deot/helper-shared';
import { debounce } from 'lodash-es';
import { useStates } from '../store';
import { TableGrid } from '../table-grid';
import { TableExpand } from './table-expand';
import { getRowValue } from '../utils';
import { getFitIndex } from '../../text/utils';
import { VcInstance } from '../../vc';
import { Popover } from '../../popover';
import type { TableProvide } from '../types';
import type { TableColumnNode, TableColumnStates } from '../table-column/table-column-node';

type RowData = Record<string, unknown>;

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
 * 	- stripe / highlight / expand 等内部行态统一挂 cell；用户 row-class/row-style 仍仅挂单行块 `vc-table__tr`；
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
			expandRows: 'expandRows'
		});

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

		const getInternalCellClass = (row: RowData, rowIndex: number) => {
			const classes: string[] = [];
			if (table.props.highlight && row === states.currentRow) {
				classes.push('current-row');
			}
			if (table.props.stripe && rowIndex % 2 === 1) {
				classes.push('vc-table__row--striped', 'is-striped');
			}
			if (states.expandRows.indexOf(row) > -1) {
				classes.push('expanded');
			}
			return classes;
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

		// —— 容器级事件委托 ——
		// cells 为 grid 容器的直接子节点：从 target 向上找到 currentTarget 的直接子级即 cell，
		// 天然屏蔽 cell 内嵌套表格的干扰（嵌套 td 的父级不是本容器）。
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
			const rowStart = props.store.rowStart ?? (props.store.rows[0]?.index || 0);
			const row = props.store.rows[rowIndex - rowStart];
			const columnNode = states.columns[columnIndex];
			if (!row || !columnNode) return null;
			return { cellEl, row: row.data, rowIndex, column: columnNode.states, columnIndex };
		};

		let poper: Nullable<{ destroy: () => void }>;
		const showTextLineTooltip = (cellEl: HTMLElement, row: RowData, column: TableColumnStates) => {
			// 判断是否text-overflow, 如果是就显示tooltip
			const el = cellEl.querySelector('.vc-table__text-line');
			const line = typeof column.line !== 'undefined'
				? column.line
				: VcInstance.options.TableColumn?.line;
			if (!el || !line) return;
			const value = `${row[column.prop!]}`;
			const endIndex = getFitIndex({
				el,
				value,
				line,
				suffix: '...'
			});
			if (endIndex > 0 && endIndex < value.length - 1) {
				poper && poper.destroy();
				poper = Popover.open({
					el: document.body,
					triggerEl: el,
					hover: true,
					alone: true,
					autoWidth: true,
					placement: 'top',
					content: value
				});
			}
		};

		const handleHoverEnter = debounce((index: number) => {
			table.store.row.setHoverIndex(index);
		}, 30);

		const handleHoverLeave = debounce(() => {
			table.store.row.setHoverIndex(null);
		}, 30);

		const enterCell = (e: MouseEvent, cell: ResolvedCell) => {
			handleHoverEnter(cell.rowIndex);
			table.hoverState.value = { cell: cell.cellEl, column: cell.column, row: cell.row };
			table.emit('cell-mouse-enter', cell.row, cell.column, cell.cellEl, e);
			showTextLineTooltip(cell.cellEl, cell.row, cell.column);
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
			poper && poper.destroy();
			handleHoverEnter.cancel();
			handleHoverLeave.cancel();
		});

		return () => {
			const block = props.store;
			const columns = states.columns;
			const rows = block.rows;
			const isSingleRow = rows.length === 1;
			const maxColumnIndex = columns.length - 1;
			const rowStart = block.rowStart ?? (rows[0]?.index || 0);

			// cells 由 store 懒构建（仅发生在可见块上）：合并块查合并计划，普通块合成 1×1
			const layoutCells = table.store.block.getCells(block);

			// selected 按行求值；用户 row-class/row-style 仅单行块挂 tr，合并块无效
			const rowSelected = rows.map((row: { data: RowData }) => table.store.selection.isSelected(row.data));
			const singleRow = isSingleRow ? rows[0] : null;

			type LayoutCell = { rowIndex: number; columnIndex: number; rowspan: number; colspan: number };
			const cells = layoutCells.reduce((pre: Record<string, unknown>[], cell: LayoutCell) => {
				const rowOffset = cell.rowIndex - rowStart;
				const row = rows[rowOffset];
				const columnNode = columns[cell.columnIndex];
				if (!row || !columnNode) return pre;
				const column = columnNode.states;

				pre.push({
					key: `${getValueOfRow(row.data, row.index)}-${column.id}`,
					rowIndex: cell.rowIndex,
					columnIndex: cell.columnIndex,
					rowspan: cell.rowspan,
					colspan: cell.colspan,
					class: [
						getInternalCellClass(row.data, cell.rowIndex),
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
						selected: rowSelected[rowOffset],
						store: table.store,
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
			const expandedRows = (isSingleRow && table.renderExpand.value)
				? rows.filter((row: { data: RowData }) => states.expandRows.indexOf(row.data) > -1)
				: [];

			if (!expandedRows.length) return grid;
			return (
				<Fragment>
					{ grid }
					<TableExpand rows={expandedRows} />
				</Fragment>
			);
		};
	}
});
