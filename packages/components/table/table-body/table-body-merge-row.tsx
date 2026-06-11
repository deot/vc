import { defineComponent, inject, onBeforeUnmount } from 'vue';
import { debounce } from 'lodash-es';
import { useStates } from '../store';
import { TableBodyRow } from './table-body-row';
import { TableMergeLayer } from '../table-merge';
import { getRowValue } from '../utils';
import { getFitIndex } from '../../text/utils';
import { VcInstance } from '../../vc';
import { Popover } from '../../popover';

export const TableBodyMergeRow = defineComponent({
	name: 'vc-table-body-merge-row',
	props: {
		store: { type: Object, required: true }
	},
	setup(props) {
		const table: any = inject('vc-table');
		const states: any = useStates({
			columns: 'columns',
			currentRow: 'currentRow'
		});

		const getValueOfRow = (row: any, index: number) => {
			const { primaryKey } = table.props;
			if (primaryKey) {
				return getRowValue(row, primaryKey);
			}
			return index;
		};

		// —— 以下为合并块（grid）专用的 cell 级逻辑，行为与 TableBodyRow 对齐 ——
		const getCellStyle = (rowIndex: number, columnIndex: number, row: any, column: any) => {
			const { cellStyle } = table.props;
			if (typeof cellStyle === 'function') {
				return cellStyle.call(null, { rowIndex, columnIndex, row, column });
			}
			return {
				...cellStyle,
				...column.style
			};
		};

		const getCellClass = (rowIndex: number, columnIndex: number, row: any, column: any) => {
			const classes = [column.realAlign, column.class, column.stickyClass];

			const cellClass = table.props.cellClass;
			if (typeof cellClass === 'string') {
				classes.push(cellClass);
			} else if (typeof cellClass === 'function') {
				classes.push(cellClass.call(null, { rowIndex, columnIndex, row, column }));
			}

			return classes.join(' ');
		};

		// grid 下没有行容器，rowClass/rowStyle/高亮/斑马纹按行合并到该行各 cell 上
		const getRowClassNames = (row: any, rowIndex: number) => {
			const classes: any[] = [];
			if (table.props.highlight && row === states.currentRow) {
				classes.push('current-row');
			}
			if (table.props.stripe && rowIndex % 2 === 1) {
				classes.push('is-striped');
			}
			const { rowClass } = table.props;
			if (typeof rowClass === 'string') {
				classes.push(rowClass);
			} else if (typeof rowClass === 'function') {
				classes.push(rowClass.call(null, { row, rowIndex }));
			}
			return classes;
		};

		const getRowStyle = (row: any, rowIndex: number) => {
			const { rowStyle } = table.props;
			if (typeof rowStyle === 'function') {
				return rowStyle.call(null, { row, rowIndex });
			}
			return rowStyle || null;
		};

		let poper: any;
		const handleCellMouseEnter = (e: any, row: any, column: any) => {
			const cell = e.currentTarget;
			table.hoverState.value = { cell, column, row };
			table.emit('cell-mouse-enter', row, column, cell, e);

			// 判断是否text-overflow, 如果是就显示tooltip
			const el = e.currentTarget.querySelector('.vc-table__text-line');
			const line = typeof column.line !== 'undefined'
				? column.line
				: VcInstance.options.TableColumn?.line;
			if (!el || !line) return;
			const value = `${row[column.prop]}`;
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

		const handleCellMouseLeave = (e: any, row: any, column: any) => {
			table.emit('cell-mouse-leave', row, column, e.currentTarget, e);
		};

		const handleHoverEnter = debounce((index: number) => {
			table.store.setHoverRow(index);
		}, 30);

		const handleHoverLeave = debounce(() => {
			table.store.setHoverRow(null);
		}, 30);

		const handleEvent = (e: any, row: any, column: any, name: string) => {
			table.emit(`cell-${name}`, row, column, e.currentTarget, e);
			table.emit(`row-${name}`, row, column, e);
		};

		const handleClick = (e: any, row: any, column: any) => {
			table.store.setCurrentRow(row);
			handleEvent(e, row, column, 'click');
		};

		onBeforeUnmount(() => {
			poper && poper.destroy();
		});

		const renderMergeLayer = () => {
			const block = props.store;
			const columns = states.columns;
			const maxColumnIndex = columns.length - 1;
			const rowStart = block.rowStart ?? (block.rows[0]?.index || 0);

			const cells = block.cells.reduce((pre: any[], cell: any) => {
				const row = block.rows[cell.rowIndex - rowStart];
				const column = columns[cell.columnIndex];
				if (!row || !column) return pre;

				pre.push({
					key: `${getValueOfRow(row.data, row.index)}-${column.id}`,
					rowIndex: cell.rowIndex,
					columnIndex: cell.columnIndex,
					rowspan: cell.rowspan,
					colspan: cell.colspan,
					class: [
						getRowClassNames(row.data, cell.rowIndex),
						getCellClass(cell.rowIndex, cell.columnIndex, row.data, column),
						'vc-table__td'
					],
					style: [
						getRowStyle(row.data, cell.rowIndex),
						getCellStyle(cell.rowIndex, cell.columnIndex, row.data, column),
						column.stickyStyle
					],
					attrs: {
						'data-row': cell.rowIndex,
						'onMouseenter': (e: any) => {
							handleHoverEnter(cell.rowIndex);
							handleCellMouseEnter(e, row.data, column);
						},
						'onMouseleave': (e: any) => {
							handleHoverLeave();
							handleCellMouseLeave(e, row.data, column);
						},
						'onClick': (e: any) => handleClick(e, row.data, column),
						'onDblclick': (e: any) => handleEvent(e, row.data, column, 'dblclick'),
						'onContextmenu': (e: any) => handleEvent(e, row.data, column, 'contextmenu')
					},
					render: () => column.renderCell({
						row: row.data,
						rowIndex: cell.rowIndex,
						column,
						columnIndex: cell.columnIndex,
						selected: table.store.isSelected(row.data),
						store: table.store,
						isHead: cell.columnIndex === 0,
						isTail: cell.columnIndex + (cell.colspan || 1) - 1 === maxColumnIndex
					})
				});
				return pre;
			}, []);

			return (
				<TableMergeLayer
					class="vc-table__merge-row"
					columns={columns}
					rowStart={rowStart}
					rowHeight={table.props.rowHeight}
					cells={cells}
				/>
			);
		};

		return () => {
			// 含合并的块走公共合并渲染层（grid）；普通块保持原有逐行渲染，零回归
			if (props.store.cells) {
				return renderMergeLayer();
			}
			return (
				<div class="vc-table__merge-row">
					{
						props.store.rows.map((row: any) => {
							const key = getValueOfRow(row, row.index);
							return (
								<TableBodyRow
									key={key}
									data={row.data}
									index={row.index}
									height={table.props.rowHeight || row.height}
								/>
							);
						})
					}
				</div>
			);
		};
	}
});
