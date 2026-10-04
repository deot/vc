import { defineComponent, ref, getCurrentInstance, computed, inject } from 'vue';
import type { Nullable } from '@deot/helper-shared';
import { IS_SERVER } from '@deot/vc-shared';
import { useDrag } from '@deot/vc-hooks';
import type { DragPoint } from '@deot/vc-hooks';
import { Popover } from '../../popover';
import { Icon } from '../../icon';
import { useStates } from '../store';
import { TableGrid } from '../table-grid';
import { TableSort } from './table-sort';
import { TableFilter } from './table-filter';
import { getColumnLine } from '../table-column/table-column-config';
import { useTextLineTooltip } from '../hooks/use-text-line-tooltip';
import type { TableColumnResizePayload, TableHeaderEventPayload, TableProvide } from '../types';
import type { TableColumnNode, TableColumnStates } from '../table-column/table-column-node';

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
		// 按下的表头列
		let resizeColumn: Nullable<TableColumnNode> = null;

		const allowDrag = computed(() => {
			return typeof props.resizable === 'boolean' ? props.resizable : props.border;
		});

		const dragLineClass = computed(() => {
			if (props.border || !props.resizable) return;

			return 'has-drag-line';
		});

		const states = useStates({
			columns: 'columns',
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
			const classes = [columnStates.id, columnStates.realHeaderAlign, columnStates.class, columnStates.labelClass];

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

		// 可拖动（列拖拽）的列：分组表头为克隆节点，按原列节点判断
		const isColumnDraggable = (column: TableColumnNode) => {
			const { drag } = table.store;
			return drag.draggable.value[1] && drag.canDragColumn(column.origin ?? column);
		};

		const handleHeaderClick = (e: MouseEvent, column: TableColumnNode) => {
			table.emit('header-click', { column: column.states, event: e } satisfies TableHeaderEventPayload);
		};

		const handleHeaderContextMenu = (e: MouseEvent, column: TableColumnNode) => {
			table.emit('header-contextmenu', { column: column.states, event: e } satisfies TableHeaderEventPayload);
		};

		// 列宽拖动结束：隐藏辅助线并复位
		const resetResize = () => {
			document.body.style.cursor = '';
			dragging.value = false;
			draggingColumn.value = null;
			dragState.value = {};

			table.resizeProxyVisible.value = false;
		};

		const handleResizeStart = (e: DragPoint) => {
			const column = resizeColumn!;
			if (column.childNodes.length > 0) return false;
			if (!draggingColumn.value || !allowDrag.value) return false;

			dragging.value = true;

			table.resizeProxyVisible.value = true;

			const tableEl = table.tableWrapper.value!;
			const tableLeft = tableEl.getBoundingClientRect().left;
			const columnEl: HTMLElement = instance.vnode.el!.querySelector(`.vc-table__th.${column.states.id}`);
			const columnRect = columnEl.getBoundingClientRect();

			dragState.value = {
				startMouseLeft: e.clientX,
				startLeft: columnRect.right - tableLeft,
				startColumnLeft: columnRect.left - tableLeft,
				minLeft: columnRect.left - tableLeft + 30
			};

			table.resizeProxy.value!.style.left = dragState.value.startLeft + 'px';
			return true;
		};

		const handleResizeMove = (e: DragPoint) => {
			const { startMouseLeft, startLeft, minLeft } = dragState.value;
			const proxyLeft = startLeft + e.clientX - startMouseLeft;

			table.resizeProxy.value!.style.left = Math.max(minLeft, proxyLeft) + 'px';
		};

		const handleResizeEnd = () => {
			const column = resizeColumn!;
			const {
				startColumnLeft,
				startLeft
			} = dragState.value;
			const finalLeft = parseInt(table.resizeProxy.value!.style.left, 10);
			const columnWidth = finalLeft - startColumnLeft;
			column.states.width = column.states.minWidth = column.states.realWidth = columnWidth;
			column.states.resized = true;
			table.emit('column-resize', {
				column: column.states,
				width: columnWidth,
				oldWidth: startLeft - startColumnLeft
			} satisfies TableColumnResizePayload);

			table.store.scheduleLayout();
			resetResize();
		};

		// 列宽只用鼠标拖动；mouseup 丢失时的指针位置不作数，放弃这次调整
		const drag = useDrag({
			selectable: false,
			start: (_, point) => handleResizeStart(point),
			move: (_, point) => handleResizeMove(point),
			end: handleResizeEnd,
			cancel: resetResize
		});

		const handleMouseDown = (e: MouseEvent, column: TableColumnNode) => {
			// 拖动中不受理新的按下（如按住主键时又按了右键）
			if (dragging.value) return;

			resizeColumn = column;
			drag.listeners.onMousedown(e);
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
				// rect 为视口坐标，须与 clientX 比较（pageX 含页面滚动）
				// 列宽拖拽区：单元格自身的光标（如可拖动列的 move）由 is-resize-zone 改为 col-resize
				const zone = rect.width > 12 && rect.right - event.clientX < 8;
				target.classList.toggle('is-resize-zone', zone);
				bodyStyle.cursor = zone ? 'col-resize' : '';
				draggingColumn.value = zone ? column : null;
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

		const handleCellMouseEnter = (e: MouseEvent, column: TableColumnStates) => {
			// 拖拽排序中不弹出提示
			if (table.store.states.dragging) return;
			Popover.open({
				element: document.body,
				name: 'vc-table-header-popover', // 确保不重复创建
				triggerElement: e.currentTarget,
				hover: true,
				theme: 'dark',
				placement: 'top',
				content: column.tooltip,
				alone: true
			});
		};

		const textLineTooltip = useTextLineTooltip();

		// 默认 label 为多行省略（header-line），被截断时展示完整内容；自定义表头内没有 text-line，不处理
		const handleLabelMouseEnter = (e: MouseEvent, column: TableColumnStates) => {
			if (table.store.states.dragging) return;
			const label = e.currentTarget as HTMLElement;
			textLineTooltip.open(label.querySelector(':scope > .vc-table__text-line'), getColumnLine(column, 'headerLine'), label);
		};

		/**
		 * label 与图标（tooltip / 排序 / 筛选）横向排列：label 可收缩，图标始终可见
		 * @param column 列
		 * @param columnIndex 列在当前表头行的下标
		 * @returns cell 内容
		 */
		const renderCellContent = (column: TableColumnNode, columnIndex: number) => {
			const { states: columnStates } = column;
			return (
				<div
					class={['vc-table__cell', columnStates.labelClass]}
				>
					<div
						class="vc-table__th-label"
						onMouseenter={(e: MouseEvent) => handleLabelMouseEnter(e, columnStates)}
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
					</div>
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
						// filter-options 原样透传（含 onChange / onUpdate:modelValue 监听）
						columnStates.filterOptions
							? <TableFilter {...columnStates.filterOptions} />
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
							isColumnDraggable(column) && 'is-column-draggable',
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
