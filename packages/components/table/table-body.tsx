import { defineComponent, ref, getCurrentInstance, watch, computed, inject, onBeforeMount, onBeforeUnmount } from 'vue';
import { debounce } from 'lodash-es';
import { addClass, removeClass } from '@deot/helper-dom';
import { IS_SERVER } from '@deot/vc-shared';
import { raf } from '@deot/helper-utils';
import { Popover } from '../popover';
import { RecycleList } from '../recycle-list';
import { NormalList } from './normal-list';
import { getCell, getColumnByCell, getRowValue } from './utils';
import { getFitIndex } from '../text/utils';
import { VcInstance } from '../vc';

import { useStates } from './store';

export const TableBody = defineComponent({
	name: 'vc-table-body',
	props: {
		fixed: String,
		heightStyle: [Object, Array, String]
	},
	emits: ['scroll'],
	setup(props, { emit, expose }) {
		const instance = getCurrentInstance()!;
		const table: any = inject('vc-table');

		const allowRender = ref(false);
		const states: any = useStates({
			data: 'data',
			list: 'list',
			columns: 'columns',
			leftFixedLeafCount: 'leftFixedLeafColumnsLength',
			rightFixedLeafCount: 'rightFixedLeafColumnsLength',
			columnsCount: states$ => states$.columns.length,
			leftFixedCount: states$ => states$.leftFixedColumns.length,
			rightFixedCount: states$ => states$.rightFixedColumns.length,
			hasExpandColumn: states$ => states$.columns.some(({ type }) => type === 'expand'),
			firstDefaultColumnIndex: states$ => states$.columns.findIndex(({ type }) => type === 'default')
		});

		const wrapper = ref();

		watch(
			() => table.store.states.hoverRowIndex,
			(v, oldV) => {
				if (!table.store.states.isComplex || IS_SERVER) return;
				raf(() => {
					const rows = instance.vnode.el!.querySelectorAll('.vc-table__row');
					const oldRow = rows[oldV];
					const newRow = rows[v];
					oldRow && removeClass(oldRow, 'hover-row');
					newRow && addClass(newRow, 'hover-row');
				});
			}
		);

		const getValueOfRow = (row: any, index: number) => {
			const { primaryKey } = table.props;
			if (primaryKey) {
				return getRowValue(row, primaryKey);
			}
			return index;
		};

		const isColumnHidden = (index: number) => {
			if (props.fixed === 'left') {
				return index >= states.leftFixedLeafCount;
			} else if (props.fixed === 'right') {
				return index < states.columnsCount - states.rightFixedLeafCount;
			} else {
				return (index < states.leftFixedLeafCount) || (index >= states.columnsCount - states.rightFixedLeafCount);
			}
		};

		const columnsHidden = computed(() => {
			return states.columns.map((_: any, index: number) => isColumnHidden(index));
		});

		const getSpan = (row, column, rowIndex, columnIndex) => {
			let rowspan = 1;
			let colspan = 1;
			const { getSpan: $getSpan } = table.props;
			if (typeof $getSpan === 'function') {
				const result = $getSpan({
					row,
					column,
					rowIndex,
					columnIndex
				});
				if (Array.isArray(result)) {
					rowspan = result[0];
					colspan = result[1];
				} else if (typeof result === 'object') {
					rowspan = result.rowspan;
					colspan = result.colspan;
				}
			}
			return { rowspan, colspan };
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

		const getRowClass = (row: any, rowIndex: number) => {
			const classes = ['vc-table__row'];
			if (table.props.highlight && row === table.store.states.currentRow) {
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

			if (table.store.states.expandRows.indexOf(row) > -1) {
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
			const classes = [column.realAlign, column.class];

			if (isColumnHidden(columnIndex)) {
				classes.push('is-hidden');
			}

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

		const getColspanRealWidth = (columns, colspan, index) => {
			if (colspan < 1) {
				return columns[index].realWidth;
			}
			const widthArr = columns.map(({ realWidth }) => realWidth).slice(index, index + colspan);
			return widthArr.reduce((acc, width) => acc + width, -1);
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

		const renderRow = (rowData: any, rowIndex: number) => {
			const { rowHeight } = table.props;
			const { data: row } = rowData;
			const { columns } = states;
			const key = getValueOfRow(row, rowIndex);
			const selected = table.store.isSelected(row);
			const height = rowHeight || rowData.height;
			const maxColumnIndex = columns.length - 1;
			return (
				<div
					key={key}
					class={[getRowClass(row, rowIndex), 'vc-table__tr']}
					style={getRowStyle(row, rowIndex)}
					onDblclick={(e: any) => handleDoubleClick(e, row)}
					onClick={(e: any) => handleClick(e, row)}
					onContextmenu={(e: any) => handleContextMenu(e, row)}
					onMouseenter={() => handleMouseEnter(rowIndex)}
					onMouseleave={() => handleMouseLeave()}
				>
					{
						columns.map((column: any, columnIndex: number) => {
							const { realWidth, renderCell } = column;
							const sizeStyle = {
								width: `${realWidth}px`,
								height: `${height ? `${height}px` : 'auto'}`
							};
							if (columnsHidden.value[columnIndex]) {
								return <div key={column.id} style={[sizeStyle]}></div>;
							}
							return (
								<div
									key={column.id}
									style={[getCellStyle(rowIndex, columnIndex, row, column), sizeStyle]}
									class={[getCellClass(rowIndex, columnIndex, row, column), 'vc-table__td']}
									onMouseenter={(e: any) => handleCellMouseEnter(e, row, column)}
									onMouseleave={(e: any) => handleCellMouseLeave(e, row, column)}
								>
									{
										renderCell(
											{
												row,
												column,
												rowIndex,
												columnIndex,
												selected,
												store: table.store,
												isHead: columnIndex === 0,
												isTail: columnIndex === maxColumnIndex
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

		const renderMergeRow = (mergeData: any) => {
			const { rows, id } = mergeData;
			return (
				<div class="vc-table__merge-row" key={id}>
					{
						rows.map((row: any) => {
							return renderRow(row, row.index);
						})
					}
				</div>
			);
		};

		const handleMergeRowResize = (v: any) => {
			if (table.props.rowHeight) return;
			states.list[v.index].rows.forEach((row: any) => {
				const old = row.heightMap[props.fixed! || 'main'];
				if (old === v.size) return;

				row.heightMap[props.fixed! || 'main'] = v.size;

				const heights = [row.heightMap.main];
				if (states.leftFixedCount) {
					heights.push(row.heightMap.left);
				}
				if (states.rightFixedCount) {
					heights.push(row.heightMap.right);
				}
				if (heights.every(i => !!i)) {
					row.height = Math.max(row.heightMap.left, row.heightMap.main, row.heightMap.right) || '';
				}
			});
		};

		expose({
			wrapper,
			getRootElement: () => instance.vnode.el
		});
		const layout = table.layout;

		let timer: any;
		onBeforeMount(() => {
			if (table.props.delay) {
				timer = setTimeout(() => allowRender.value = true, table.props.delay);
			} else {
				allowRender.value = true;
			}
		});
		onBeforeUnmount(() => {
			poper && poper.destroy();
			timer && clearTimeout(timer);
			allowRender.value = false;
		});
		return () => {
			if (!allowRender.value) return;
			return (
				<div class="vc-table__body">
					{
						table.props.height
							? (
									<RecycleList
										ref={wrapper}
										data={states.list}
										disabled={true}
										class="vc-table__tbody"
										scrollerOptions={{
											barTo: `.${table.tableId}`,
											native: false,
											always: false,
											showBar: !props.fixed,
											stopPropagation: !props.fixed,
											trackOffsetY: [
												layout.states.headerHeight,
												0,
												-layout.states.headerHeight - layout.states.footerHeight + 2, // 2为上下border的高度
												0
											]
										}}
										pageSize={table.props.rows}
										onScroll={(e: any) => emit('scroll', e)}
										onRowResize={handleMergeRowResize}
										style={props.heightStyle}
									>
										{{ default: ({ row }) => renderMergeRow(row) }}
									</RecycleList>
								)
							: (
									<NormalList
										data={states.list}
										onRowResize={handleMergeRowResize}
									>
										{{ default: ({ row }) => renderMergeRow(row) }}
									</NormalList>
								)
					}
				</div>
			);
		};
	}
});
