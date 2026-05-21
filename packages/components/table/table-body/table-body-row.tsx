import { defineComponent, inject, computed, onBeforeUnmount } from 'vue';
import { debounce } from 'lodash-es';

import { useStates } from '../store';

import { getCell, getColumnByCell } from '../utils';
import { getFitIndex } from '../../text/utils';
import { VcInstance } from '../../vc';
import { Popover } from '../../popover';

export const TableBodyRow = defineComponent({
	name: 'vc-table-body-row',
	props: {
		data: { type: Object, required: true },
		index: { type: Number, required: true },
		height: { type: [Number, String] }
	},
	setup(props) {
		const table: any = inject('vc-table');
		const states: any = useStates({
			columns: 'columns',
			currentRow: 'currentRow',
			expandRows: 'expandRows'
		});

		const selected = computed(() => table.store.isSelected(props.data));
		const maxColumnIndex = computed(() => states.columns.length - 1);

		const getRowClass = (row: any, rowIndex: number) => {
			const classes = ['vc-table__row'];
			if (table.props.highlight && row === states.currentRow) {
				classes.push('current-row');
			}

			if (table.props.stripe && rowIndex % 2 === 1) {
				classes.push('vc-table__row--striped');
			}
			const rowClass = table.props.rowClass;
			if (typeof rowClass === 'string') {
				classes.push(rowClass);
			} else if (typeof rowClass === 'function') {
				classes.push(rowClass.call(null, {
					row,
					rowIndex
				}));
			}

			if (states.expandRows.indexOf(row) > -1) {
				classes.push('expanded');
			}

			return classes;
		};

		const getCellStyle = (rowIndex: number, columnIndex: number, row: any, column: any) => {
			const { cellStyle } = table.props;
			if (typeof cellStyle === 'function') {
				return cellStyle.call(null, {
					rowIndex,
					columnIndex,
					row,
					column
				});
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
				classes.push(cellClass.call(null, {
					rowIndex,
					columnIndex,
					row,
					column
				}));
			}

			return classes.join(' ');
		};

		const getRowStyle = (row: any, rowIndex: number) => {
			const { rowStyle } = table.props;
			if (typeof rowStyle === 'function') {
				return rowStyle.call(null, {
					row,
					rowIndex
				});
			}
			return rowStyle || null;
		};

		let poper;
		const handleCellMouseEnter = (e: any, row: any, column: any) => {
			const cell = getCell(e);
			const hoverState = { cell, column, row };

			if (cell) {
				table.hoverState.value = hoverState;
				table.emit('cell-mouse-enter', hoverState.row, hoverState.column, hoverState.cell, e);
			}
			// 判断是否text-overflow, 如果是就显示tooltip
			const el = e.target.querySelector('.vc-table__text-line');
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
			const cell = getCell(e);
			if (!cell) return;

			table.emit('cell-mouse-leave', row, column, cell, e);
		};

		const handleMouseEnter = debounce((index: number) => {
			table.store.setHoverRow(index);
		}, 30);

		const handleMouseLeave = debounce(() => {
			table.store.setHoverRow(null);
		}, 30);

		const handleEvent = (e: any, row: any, name: string) => {
			const cell = getCell(e);
			let column;
			if (cell) {
				column = getColumnByCell(states.columns, cell);
				if (column) {
					table.emit(`cell-${name}`, row, column, cell, e);
				}
			}
			table.emit(`row-${name}`, row, column, e);
		};

		const handleContextMenu = (e: any, row: any) => {
			handleEvent(e, row, 'contextmenu');
		};

		const handleDoubleClick = (e: any, row: any) => {
			handleEvent(e, row, 'dblclick');
		};

		const handleClick = (e: any, row: any) => {
			table.store.setCurrentRow(row);
			handleEvent(e, row, 'click');
		};

		onBeforeUnmount(() => {
			poper && poper.destroy();
		});

		return () => {
			return (
				<div
					class={[getRowClass(props.data, props.index), 'vc-table__tr']}
					style={getRowStyle(props.data, props.index)}
					data-row={props.index}
					onDblclick={(e: any) => handleDoubleClick(e, props.data)}
					onClick={(e: any) => handleClick(e, props.data)}
					onContextmenu={(e: any) => handleContextMenu(e, props.data)}
					onMouseenter={() => handleMouseEnter(props.index)}
					onMouseleave={() => handleMouseLeave()}
				>
					{
						states.columns.map((column: any, columnIndex: number) => {
							const { realWidth, renderCell } = column;
							const sizeStyle = {
								width: `${realWidth}px`,
								height: `${props.height ? `${props.height}px` : 'auto'}`
							};
							return (
								<div
									key={column.id}
									style={[getCellStyle(props.index, columnIndex, props.data, column), sizeStyle, column.stickyStyle]}
									class={[getCellClass(props.index, columnIndex, props.data, column), 'vc-table__td']}
									onMouseenter={(e: any) => handleCellMouseEnter(e, props.data, column)}
									onMouseleave={(e: any) => handleCellMouseLeave(e, props.data, column)}
								>
									{
										renderCell(
											{
												row: props.data,
												rowIndex: props.index,
												column,
												columnIndex,
												selected: selected.value,
												store: table.store,
												isHead: columnIndex === 0,
												isTail: columnIndex === maxColumnIndex.value
											}
										)
									}
								</div>
							);
						})
					}
				</div>
			);
		};
	}
});
