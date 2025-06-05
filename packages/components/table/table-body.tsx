import { defineComponent, ref, getCurrentInstance, watch, computed } from 'vue';
import { debounce } from 'lodash-es';
import { addClass, removeClass, hasClass } from '@deot/helper-dom';
import { IS_SERVER } from '@deot/vc-shared';
import { raf } from '@deot/helper-utils';
import { getInstance } from '@deot/vc-hooks';
import { Popover } from '../popover';
import { RecycleList } from '../recycle-list';
import { getCell, getColumnByCell, getRowIdentity } from './utils';

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
			leftFixedLeafCount: 'fixedLeafColumnsLength',
			rightFixedLeafCount: 'rightFixedLeafColumnsLength',
			columnsCount: states$ => states$.columns.length,
			leftFixedCount: states$ => states$.fixedColumns.length,
			rightFixedCount: states$ => states$.rightFixedColumns.length,
			hasExpandColumn: states$ => states$.columns.some(({ type }) => type === 'expand'),
			firstDefaultColumnIndex: states$ => states$.columns.findIndex(({ type }) => type === 'default')
		});

		watch(
			() => props.store!.states.hoverRow,
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

		const getKeyOfRow = (row, index) => {
			const { rowKey } = table.props;
			if (rowKey) {
				return getRowIdentity(row, rowKey);
			}
			return index;
		};

		const isColumnHidden = (index) => {
			if (props.fixed === 'left') {
				return index >= states.leftFixedLeafCount;
			} else if (props.fixed === 'right') {
				return index < states.columnsCount - states.rightFixedLeafCount;
			} else {
				return (index < states.leftFixedLeafCount) || (index >= states.columnsCount - states.rightFixedLeafCount);
			}
		};

		const columnsHidden = computed(() => {
			return states.columns.map((_, index) => isColumnHidden(index));
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

		const getRowStyle = (row, rowIndex) => {
			const { rowStyle } = table.props;
			if (typeof rowStyle === 'function') {
				return rowStyle.call(null, {
					row,
					rowIndex
				});
			}
			return rowStyle || null;
		};

		const getRowClass = (row, rowIndex) => {
			const classes = ['vc-table__row'];
			if (table.props.highlightCurrentRow && row === props.store!.states.currentRow) {
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

		const getCellStyle = (rowIndex, columnIndex, row, column) => {
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

		const getCellClass = (rowIndex, columnIndex, row, column) => {
			const classes = [column.align, column.className];

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

		const handleCellMouseEnter = (e, row) => {
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

		const handleCellMouseLeave = (e) => {
			const cell = getCell(e);
			if (!cell) return;

			const oldHoverState = table.exposed.hoverState.value || {};
			table.emit('cell-mouse-leave', oldHoverState.row, oldHoverState.column, oldHoverState.cell, event);
		};

		const handleMouseEnter = debounce((index) => {
			props.store!.setHoverRow(index);
		}, 30);

		const handleMouseLeave = debounce(() => {
			props.store!.setHoverRow(null);
		}, 30);

		const handleEvent = (e, row, name) => {
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

		const handleContextMenu = (e, row) => {
			handleEvent(e, row, 'contextmenu');
		};

		const handleDoubleClick = (e, row) => {
			handleEvent(e, row, 'dblclick');
		};

		const handleClick = (e, row) => {
			props.store!.setCurrentRow(row);
			handleEvent(e, row, 'click');
		};

		const renderRow = (rowData, rowIndex) => {
			const { data: row } = rowData;
			const { columns } = states;
			const key = getKeyOfRow(row, rowIndex);

			return (
				<div
					key={key}
					class={[getRowClass(row, rowIndex), 'vc-table__tr']}
					style={getRowStyle(row, rowIndex)}
					onDblclick={$event => handleDoubleClick($event, row)}
					onClick={$event => handleClick($event, row)}
					onContextmenu={$event => handleContextMenu($event, row)}
					onMouseenter={() => handleMouseEnter(rowIndex)}
					onMouseleave={$event => handleMouseLeave($event)}
				>
					{
						columns.map((column, columnIndex) => {
							const { realWidth, renderCell } = column;
							const sizeStyle = { width: `${realWidth}px`, height: `${rowData.height ? `${rowData.height}px` : 'auto'}` };
							if (columnsHidden.value[columnIndex]) {
								return <div style={[sizeStyle]}></div>;
							}
							return (
								<div
									style={[getCellStyle(rowIndex, columnIndex, row, column), sizeStyle]}
									class={[getCellClass(rowIndex, columnIndex, row, column), 'vc-table__td']}
									onMouseenter={$event => handleCellMouseEnter($event, row)}
									onMouseleave={$event => handleCellMouseLeave($event)}
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

		const renderMergeRow = (mergeData, mergeIndex) => {
			const { rows } = mergeData;
			return (
				<div class="vc-table__merge-row" key={mergeIndex}>
					{
						rows.map((row) => {
							return renderRow(row, row.index);
						})
					}
				</div>
			);
		};

		const handleMergeRowResize = (v) => {
			states.list[v.index].rows.forEach((row: any) => {
				row.heightMap[props.fixed! || 'main'] = v.size;
				row.height = Math.max(row.heightMap.left, row.heightMap.main, row.heightMap.right) || '';
			});
		};

		const wrapper = ref();
		expose({
			wrapper,
			getRootElement: () => instance.vnode.el
		});
		return () => {
			const layout = table.exposed.layout;
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
											always: true,
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
										onScroll={e => emit('scroll', e)}
										onRowResize={handleMergeRowResize}
										style={props.heightStyle}
									>
										{({ row, index }) => renderMergeRow(row, index)}
									</RecycleList>
								)
							: states.list.map((row, index) => renderMergeRow(row, index))
					}
				</div>
			);
		};
	}
});
