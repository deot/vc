import { defineComponent, ref, getCurrentInstance, watch, computed } from 'vue';
import { debounce } from 'lodash-es';
import { addClass, removeClass, hasClass } from '@deot/helper-dom';
import { IS_SERVER } from '@deot/vc-shared';
import { raf } from '@deot/helper-utils';
import { getInstance } from '@deot/vc-hooks';
import { Popover } from '../popover';
import { RecycleList } from '../recycle-list';
import { NormalList } from './normal-list';
import { getCell, getColumnByCell, getRowValue } from './utils';

import { useStates } from './store';

export const TableBody = defineComponent({
	name: 'vc-table-body',
	props: {
		store: Object,
		fixed: String,
		heightStyle: [Object, Array, String]
	},
	emits: ['scroll'],
	setup(props, { emit, expose }) {
		const instance = getCurrentInstance()!;
		const table: any = getInstance('table', 'tableId');

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
			() => props.store!.states.hoverRowIndex,
			(v, oldV) => {
				if (!props.store!.states.isComplex || IS_SERVER) return;
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
			if (table.props.highlight && row === props.store!.states.currentRow) {
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

			if (props.store!.states.expandRows.indexOf(row) > -1) {
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
			return cellStyle;
		};

		const getCellClass = (rowIndex: number, columnIndex: number, row: any, column: any) => {
			const classes = [column.realAlign, column.className];

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

		const handleCellMouseEnter = (e: any, row: any) => {
			const cell = getCell(e);

			if (cell) {
				const column = getColumnByCell(states.columns, cell);
				const hoverState = { cell, column, row };
				table.exposed.hoverState.value = hoverState;

				table.emit('cell-mouse-enter', hoverState.row, hoverState.column, hoverState.cell, e);
			}

			// 判断是否text-overflow, 如果是就显示tooltip
			const cellChild = e.target.querySelector('.vc-table__cell');

			if (!(hasClass(cellChild, 'vc-popover') && cellChild.childNodes.length)) {
				return;
			}
			// 使用范围宽度而不是滚动宽度来确定文本是否溢出，以解决潜在的FireFox bug
			// https://bugzilla.mozilla.org/show_bug.cgi?id=1074543#c3
			const range = document.createRange();
			range.setStart(cellChild, 0);
			range.setEnd(cellChild, cellChild.childNodes.length);
			const rangeWidth = range.getBoundingClientRect().width;
			const padding = (parseInt(cellChild.style.paddingLeft, 10) || 0) + (parseInt(cellChild.style.paddingRight, 10) || 0);
			if ((rangeWidth + padding > cellChild.offsetWidth || cellChild.scrollWidth > cellChild.offsetWidth)) {
				Popover.open({
					el: document.body,
					name: 'vc-table-popover', // 确保不重复创建
					triggerEl: cell,
					hover: true,
					theme: 'dark',
					placement: 'top',
					content: cell.innerText || cell.textContent,
					alone: true
				});
			}
		};

		const handleCellMouseLeave = (e: any) => {
			const cell = getCell(e);
			if (!cell) return;

			const oldHoverState = table.exposed.hoverState.value || {};
			table.emit('cell-mouse-leave', oldHoverState.row, oldHoverState.column, oldHoverState.cell, e);
		};

		const handleMouseEnter = debounce((index: number) => {
			props.store!.setHoverRow(index);
		}, 30);

		const handleMouseLeave = debounce(() => {
			props.store!.setHoverRow(null);
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
			props.store!.setCurrentRow(row);
			handleEvent(e, row, 'click');
		};

		const renderRow = (rowData: any, rowIndex: number) => {
			const { data: row } = rowData;
			const { columns } = states;
			const key = getValueOfRow(row, rowIndex);
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
							const sizeStyle = { width: `${realWidth}px`, height: `${rowData.height ? `${rowData.height}px` : 'auto'}` };
							if (columnsHidden.value[columnIndex]) {
								return <div style={[sizeStyle]}></div>;
							}
							return (
								<div
									style={[getCellStyle(rowIndex, columnIndex, row, column), sizeStyle]}
									class={[getCellClass(rowIndex, columnIndex, row, column), 'vc-table__td']}
									onMouseenter={(e: any) => handleCellMouseEnter(e, row)}
									onMouseleave={(e: any) => handleCellMouseLeave(e)}
								>
									{
										renderCell(
											{
												row,
												column,
												rowIndex,
												columnIndex,
												store: props.store
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

		const renderMergeRow = (mergeData: any, mergeIndex: number) => {
			const { rows } = mergeData;
			return (
				<div class="vc-table__merge-row" key={mergeIndex}>
					{
						rows.map((row: any) => {
							return renderRow(row, row.index);
						})
					}
				</div>
			);
		};

		const handleMergeRowResize = (v: any) => {
			states.list[v.index].rows.forEach((row: any) => {
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
		const layout = table.exposed.layout;
		return () => {
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
											barTo: `.${table.exposed.tableId}`,
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
										{{ default: ({ row, index }) => renderMergeRow(row, index) }}
									</RecycleList>
								)
							: (
									<NormalList
										data={states.list}
										onRowResize={handleMergeRowResize}
									>
										{{ default: ({ row, index }) => renderMergeRow(row, index) }}
									</NormalList>
								)
					}
				</div>
			);
		};
	}
});
