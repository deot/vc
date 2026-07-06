import { defineComponent, ref, getCurrentInstance, computed, inject } from 'vue';
import type { Nullable } from '@deot/helper-shared';
import { addClass, removeClass, hasClass } from '@deot/helper-dom';
import { IS_SERVER } from '@deot/vc-shared';
import { Popover } from '../../popover';
import { Icon } from '../../icon';
import { useStates } from '../store';
import { TableGrid } from '../table-grid';
import { TableSort } from './table-sort';
import type { TableProvide } from '../types';
import type { TableColumnNode, TableColumnStates } from '../table-column/table-column-node';
// import TableFilter from './table-filter';

const TableFilter = 'div';

export const TableHeader = defineComponent({
	name: 'vc-table-header',
	props: {
		border: Boolean,
		// 排序全部交给外部处理，内部不处理数据，只做交互
		sort: {
			type: Object,
			default: () => ({})
		},
		resizable: {
			type: Boolean,
			default: void 0
		}
	},

	setup(props) {
		const table = inject<TableProvide>('vc-table')!;
		const instance = getCurrentInstance()!;

		const draggingColumn = ref<Nullable<TableColumnNode>>(null);
		const dragging = ref(false);
		const dragState = ref<Record<string, number>>({});

		const allowDrag = computed(() => {
			return typeof props.resizable === 'boolean' ? props.resizable : props.border;
		});

		const dragLineClass = computed(() => {
			if (props.border || !props.resizable) return;

			return 'has-drag-line';
		});

		const states = useStates({
			columns: 'columns',
			isAllSelected: 'isAllSelected',
			isGroup: 'isGroup',
			headerRows: 'headerRows'
		});

		const getHeaderRowStyle = () => {
			const { headerRowStyle } = table.props;
			if (typeof headerRowStyle === 'function') {
				return headerRowStyle.call(null);
			}
			return headerRowStyle;
		};

		const getHeaderRowClass = () => {
			const { headerRowClass } = table.props;
			if (typeof headerRowClass === 'string') {
				return headerRowClass;
			}
			if (typeof headerRowClass === 'function') {
				return headerRowClass.call(null);
			}
			return '';
		};

		const getHeaderCellStyle = (rowIndex: number, columnIndex: number, row: TableColumnNode[], column: TableColumnNode) => {
			const { headerCellStyle } = table.props;
			if (typeof headerCellStyle === 'function') {
				return headerCellStyle.call(null, {
					rowIndex,
					columnIndex,
					row,
					column: column.states
				});
			}
			return {
				...headerCellStyle,
				...column.states.style
			};
		};

		const getHeaderCellClass = (rowIndex: number, columnIndex: number, row: TableColumnNode[], column: TableColumnNode) => {
			const { states: columnStates } = column;
			const classes = [columnStates.id, columnStates.order, columnStates.realHeaderAlign, columnStates.class, columnStates.labelClass];

			if (!column.childNodes.length) {
				classes.push('is-leaf');
			}

			const { headerCellClass } = table.props;
			if (typeof headerCellClass === 'string') {
				classes.push(headerCellClass);
			} else if (typeof headerCellClass === 'function') {
				classes.push(headerCellClass.call(null, {
					rowIndex,
					columnIndex,
					row,
					column: columnStates
				}));
			}

			return classes.join(' ');
		};

		const handleHeaderClick = (e: MouseEvent, column: TableColumnNode) => {
			table.emit('header-click', column.states, e);
		};

		const handleHeaderContextMenu = (e: MouseEvent, column: TableColumnNode) => {
			table.emit('header-contextmenu', column.states, e);
		};

		const handleMouseDown = (e: MouseEvent, column: TableColumnNode) => {
			if (IS_SERVER) return;
			if (column.childNodes.length > 0) return;
			/* istanbul ignore if */
			if (draggingColumn.value && allowDrag.value) {
				dragging.value = true;

				table.resizeProxyVisible.value = true;

				const tableEl = table.tableWrapper.value!;
				const tableLeft = tableEl.getBoundingClientRect().left;
				const columnEl: HTMLElement = instance.vnode.el!.querySelector(`.vc-table__th.${column.states.id}`);
				const columnRect = columnEl.getBoundingClientRect();
				const minLeft = columnRect.left - tableLeft + 30;

				addClass(columnEl, 'noclick');

				dragState.value = {
					startMouseLeft: e.clientX,
					startLeft: columnRect.right - tableLeft,
					startColumnLeft: columnRect.left - tableLeft,
					tableLeft
				};

				const resizeProxy = table.resizeProxy.value!;
				resizeProxy.style.left = dragState.value.startLeft + 'px';

				document.onselectstart = () => false;
				document.ondragstart = () => false;

				const handleDocumentMouseMove = ($e: MouseEvent) => {
					const deltaLeft = $e.clientX - dragState.value.startMouseLeft;
					const proxyLeft = dragState.value.startLeft + deltaLeft;

					resizeProxy.style.left = Math.max(minLeft, proxyLeft) + 'px';
				};

				const handleDocumentMouseUp = () => {
					if (dragging.value) {
						const {
							startColumnLeft,
							startLeft
						} = dragState.value;
						const finalLeft = parseInt(resizeProxy.style.left, 10);
						const columnWidth = finalLeft - startColumnLeft;
						column.states.width = column.states.minWidth = column.states.realWidth = columnWidth;
						table.emit('header-dragend', column.states.width, startLeft - startColumnLeft, column.states);

						table.store.scheduleLayout();

						document.body.style.cursor = '';
						dragging.value = false;
						draggingColumn.value = null;
						dragState.value = {};

						table.resizeProxyVisible.value = false;
					}

					document.removeEventListener('mousemove', handleDocumentMouseMove);
					document.removeEventListener('mouseup', handleDocumentMouseUp);
					document.onselectstart = null;
					document.ondragstart = null;

					setTimeout(function () {
						removeClass(columnEl, 'noclick');
					}, 0);
				};

				document.addEventListener('mousemove', handleDocumentMouseMove);
				document.addEventListener('mouseup', handleDocumentMouseUp);
			}
		};

		const handleMouseMove = (event: MouseEvent, column: TableColumnNode) => {
			if (column.childNodes.length > 0) return;
			let target = event.target as Nullable<HTMLElement>;
			while (target && !target.classList?.contains?.('vc-table__th')) {
				target = target.parentNode as Nullable<HTMLElement>;
			}

			if (!column || !column.states.resizable || !target) return;

			if (!dragging.value && allowDrag.value) {
				const rect = target.getBoundingClientRect();

				const bodyStyle = document.body.style;
				if (rect.width > 12 && rect.right - event.pageX < 8) {
					bodyStyle.cursor = 'col-resize';
					if (hasClass(target, 'is-sortable')) {
						target.style.cursor = 'col-resize';
					}
					draggingColumn.value = column;
				} else if (!dragging.value) {
					bodyStyle.cursor = '';
					if (hasClass(target, 'is-sortable')) {
						target.style.cursor = 'pointer';
					}
					draggingColumn.value = null;
				}
			}
		};

		const handleMouseOut = () => {
			if (IS_SERVER) return;
			document.body.style.cursor = '';
		};

		const handleSort = (prop: string, order: string) => {
			const v = { prop, order };

			table.emit('update:sort', v);
			table.emit('sort-change', v);
		};

		const handleFilter = (column: TableColumnStates, value: unknown) => {
			const { filter } = column;
			filter && filter(value);
		};

		const handleCellMouseEnter = (e: MouseEvent, column: TableColumnStates) => {
			Popover.open({
				el: document.body,
				name: 'vc-table-header-popover', // 确保不重复创建
				triggerEl: e.currentTarget,
				hover: true,
				theme: 'dark',
				placement: 'top',
				content: column.tooltip,
				alone: true
			});
		};

		const renderCellContent = (column: TableColumnNode, columnIndex: number) => {
			const { states: columnStates } = column;
			return (
				<div
					class={[
						'vc-table__cell',
						// {
						// 	"is-highlight": column.filteredValue && column.filteredValue.length > 0
						// },
						columnStates.labelClass
					]}
				>
					{
						columnStates.renderHeader
							? columnStates.renderHeader(
									{
										column: columnStates,
										columnIndex,
										store: table.store,
									}
								)
							: columnStates.label
					}
					{
						columnStates.tooltip
							? (
									<Icon
										type="o-info"
										class="vc-table__tooltip"
										onMouseenter={(e: MouseEvent) => handleCellMouseEnter(e, columnStates)}
									/>
								)
							: null
					}
					{
						columnStates.sortable
							? (
									<TableSort
										order={columnStates.prop === props.sort.prop ? props.sort.order : ''}
										onClick={(order: string) => handleSort(columnStates.prop!, order)}
									/>
								)
							: null
					}
					{
						columnStates.filters
							? (
									<TableFilter
										data={columnStates.filters}
										value={columnStates.filteredValue}
										icon={columnStates.filterIcon}
										portalClass={columnStates.filterPopupClass}
										multiple={columnStates.filterMultiple}
										onChange={(v: unknown) => handleFilter(columnStates, v)}
									/>
								)
							: null
					}
				</div>
			);
		};

		/**
		 * 把 states.headerRows（二维，多级表头）推导为 TableGrid 的 cells[]：
		 * 多级表头本质就是 rowspan/colspan（columnsToRowsEffect 已写在 column.states 上），
		 * 这里只需按占位推导每个 cell 的起始叶子列号（grid 列坐标）。
		 * 注意：headerRowStyle/Class 挂在 thead 内唯一 vc-table__tr 上，不再合并到 th。
		 * @returns 表头 cells
		 */
		const buildHeaderCells = () => {
			const rows = states.headerRows;
			const cells: Record<string, unknown>[] = [];
			// 占位表：跨行（rowspan）的 cell 会占用后续行的列位
			const taken: boolean[][] = rows.map(() => []);

			rows.forEach((columns, rowIndex) => {
				let gridColumnIndex = 0;
				columns.forEach((column, columnIndex) => {
					while (taken[rowIndex][gridColumnIndex]) gridColumnIndex++;
					const rowspan = column.states.rowspan || 1;
					const colspan = column.states.colspan || 1;
					for (let i = rowIndex; i < rowIndex + rowspan && i < rows.length; i++) {
						for (let j = gridColumnIndex; j < gridColumnIndex + colspan; j++) {
							taken[i][j] = true;
						}
					}

					cells.push({
						key: column.states.id,
						rowIndex,
						columnIndex: gridColumnIndex,
						rowspan,
						colspan,
						class: [
							getHeaderCellClass(rowIndex, columnIndex, columns, column),
							column.states.resizable && dragLineClass.value,
							column.states.stickyClass,
							'vc-table__th'
						],
						style: [
							getHeaderCellStyle(rowIndex, columnIndex, columns, column),
							column.states.stickyStyle
						],
						attrs: {
							onMousemove: (e: MouseEvent) => handleMouseMove(e, column),
							onMouseout: handleMouseOut,
							onMousedown: (e: MouseEvent) => handleMouseDown(e, column),
							onClick: (e: MouseEvent) => handleHeaderClick(e, column),
							onContextmenu: (e: MouseEvent) => handleHeaderContextMenu(e, column)
						},
						render: () => renderCellContent(column, columnIndex)
					});
					gridColumnIndex += colspan;
				});
			});
			return cells;
		};

		return () => {
			return (
				<div class={[{ 'is-group': states.isGroup }, 'vc-table__thead']}>
					<TableGrid
						class={[getHeaderRowClass(), 'vc-table__tr']}
						style={getHeaderRowStyle()}
						role="row"
						columns={states.columns}
						cells={buildHeaderCells()}
						cellRole="columnheader"
					/>
				</div>
			);
		};
	}
});
