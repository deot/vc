import { defineComponent, ref, getCurrentInstance, computed, inject } from 'vue';
import { addClass, removeClass, hasClass } from '@deot/helper-dom';
import { IS_SERVER } from '@deot/vc-shared';
import { Popover } from '../../popover';
import { Icon } from '../../icon';
import { useStates } from '../store';
import { TableMergeLayer } from '../table-merge';
import { TableSort } from './table-sort';
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
		const table: any = inject('vc-table');
		const instance = getCurrentInstance()!;

		const draggingColumn = ref(null);
		const dragging = ref(false);
		const dragState = ref<any>({});

		const allowDrag = computed(() => {
			return typeof props.resizable === 'boolean' ? props.resizable : props.border;
		});

		const dragLineClass = computed(() => {
			if (props.border || !props.resizable) return;

			return 'has-drag-line';
		});

		const states: any = useStates({
			columns: 'columns',
			isAllSelected: 'isAllSelected',
			isGroup: 'isGroup',
			headerRows: 'headerRows'
		});

		const getHeaderRowStyle = (rowIndex: number) => {
			const { headerRowStyle } = table.props;
			if (typeof headerRowStyle === 'function') {
				return headerRowStyle.call(null, { rowIndex });
			}
			return headerRowStyle;
		};

		const getHeaderRowClass = (rowIndex: number) => {
			const classes: any[] = [];
			const { headerRowClass } = table.props;

			if (typeof headerRowClass === 'string') {
				classes.push(headerRowClass);
			} else if (typeof headerRowClass === 'function') {
				classes.push(headerRowClass.call(null, { rowIndex }));
			}

			return classes.join(' ');
		};

		const getHeaderCellStyle = (rowIndex: number, columnIndex: number, row: any, column: any) => {
			const { headerCellStyle } = table.props;
			if (typeof headerCellStyle === 'function') {
				return headerCellStyle.call(null, {
					rowIndex,
					columnIndex,
					row,
					column
				});
			}
			return {
				...headerCellStyle,
				...column.style
			};
		};

		const getHeaderCellClass = (rowIndex: number, columnIndex: number, row: any, column: any) => {
			const classes = [column.id, column.order, column.realHeaderAlign, column.class, column.labelClass];

			if (!column.children) {
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
					column
				}));
			}

			return classes.join(' ');
		};

		const handleHeaderClick = (e: any, column: any) => {
			table.emit('header-click', column, e);
		};

		const handleHeaderContextMenu = (e: any, column: any) => {
			table.emit('header-contextmenu', column, e);
		};

		const handleMouseDown = (e: any, column: any) => {
			if (IS_SERVER) return;
			if (column.children && column.children.length > 0) return;
			/* istanbul ignore if */
			if (draggingColumn.value && allowDrag.value) {
				dragging.value = true;

				table.resizeProxyVisible.value = true;

				const tableEl = table.tableWrapper.value;
				const tableLeft = tableEl.getBoundingClientRect().left;
				const columnEl = instance.vnode.el!.querySelector(`.vc-table__th.${column.id}`);
				const columnRect = columnEl.getBoundingClientRect();
				const minLeft = columnRect.left - tableLeft + 30;

				addClass(columnEl, 'noclick');

				dragState.value = {
					startMouseLeft: e.clientX,
					startLeft: columnRect.right - tableLeft,
					startColumnLeft: columnRect.left - tableLeft,
					tableLeft
				};

				const resizeProxy = table.resizeProxy.value;
				resizeProxy.style.left = dragState.value.startLeft + 'px';

				document.onselectstart = () => false;
				document.ondragstart = () => false;

				const handleMouseMove = ($e) => {
					const deltaLeft = $e.clientX - dragState.value.startMouseLeft;
					const proxyLeft = dragState.value.startLeft + deltaLeft;

					resizeProxy.style.left = Math.max(minLeft, proxyLeft) + 'px';
				};

				const handleMouseUp = () => {
					if (dragging.value) {
						const {
							startColumnLeft,
							startLeft
						} = dragState.value;
						const finalLeft = parseInt(resizeProxy.style.left, 10);
						const columnWidth = finalLeft - startColumnLeft;
						column.width = column.minWidth = column.realWidth = columnWidth;
						table.emit('header-dragend', column.width, startLeft - startColumnLeft, column);

						table.store.scheduleLayout();

						document.body.style.cursor = '';
						dragging.value = false;
						draggingColumn.value = null;
						dragState.value = {};

						table.resizeProxyVisible.value = false;
					}

					document.removeEventListener('mousemove', handleMouseMove);
					document.removeEventListener('mouseup', handleMouseUp);
					document.onselectstart = null;
					document.ondragstart = null;

					setTimeout(function () {
						removeClass(columnEl, 'noclick');
					}, 0);
				};

				document.addEventListener('mousemove', handleMouseMove);
				document.addEventListener('mouseup', handleMouseUp);
			}
		};

		const handleMouseMove = (event: any, column: any) => {
			if (column.children && column.children.length > 0) return;
			let target = event.target;
			while (target && !target.classList?.contains?.('vc-table__th')) {
				target = target.parentNode;
			}

			if (!column || !column.resizable) return;

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

		const handleSort = (prop: string, order: any) => {
			const v = { prop, order };

			table.emit('update:sort', v);
			table.emit('sort-change', v);
		};

		const handleFilter = (column: any, value: any) => {
			const { filter } = column;
			filter && filter(value);
		};

		const handleCellMouseEnter = (e: any, column: any) => {
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

		const renderCellContent = (column: any, columnIndex: number) => {
			return (
				<div
					class={[
						'vc-table__cell',
						// {
						// 	"is-highlight": column.filteredValue && column.filteredValue.length > 0
						// },
						column.labelClass
					]}
				>
					{
						column.renderHeader
							? column.renderHeader(
									{
										column,
										columnIndex,
										store: table.store,
									}
								)
							: column.label
					}
					{
						column.tooltip
							? (
									<Icon
										type="o-info"
										class="vc-table__tooltip"
										onMouseenter={(e: any) => handleCellMouseEnter(e, column)}
									/>
								)
							: null
					}
					{
						column.sortable
							? (
									<TableSort
										order={column.prop === props.sort.prop ? props.sort.order : ''}
										onClick={(order: any) => handleSort(column.prop, order)}
									/>
								)
							: null
					}
					{
						column.filters
							? (
									<TableFilter
										data={column.filters}
										value={column.filteredValue}
										icon={column.filterIcon}
										portalClass={column.filterPopupClass}
										multiple={column.filterMultiple}
										onChange={v => handleFilter(column, v)}
									/>
								)
							: null
					}
				</div>
			);
		};

		/**
		 * 把 states.headerRows（二维，多级表头）推导为 TableMergeLayer 的 cells[]：
		 * 多级表头本质就是 rowspan/colspan（columnsToRowsEffect 已写在 column 上），
		 * 这里只需按占位推导每个 cell 的起始叶子列号（grid 列坐标）。
		 * 注意：headerRowStyle/Class 在 grid 下没有"行容器"，按行合并到该行各 cell 上。
		 * @returns 表头 cells
		 */
		const buildHeaderCells = () => {
			const rows: any[][] = states.headerRows;
			const cells: any[] = [];
			// 占位表：跨行（rowspan）的 cell 会占用后续行的列位
			const taken: boolean[][] = rows.map(() => []);

			rows.forEach((columns: any[], rowIndex: number) => {
				let gridColumnIndex = 0;
				columns.forEach((column: any, columnIndex: number) => {
					while (taken[rowIndex][gridColumnIndex]) gridColumnIndex++;
					const rowspan = column.rowspan || 1;
					const colspan = column.colspan || 1;
					for (let i = rowIndex; i < rowIndex + rowspan && i < rows.length; i++) {
						for (let j = gridColumnIndex; j < gridColumnIndex + colspan; j++) {
							taken[i][j] = true;
						}
					}

					cells.push({
						key: column.id,
						rowIndex,
						columnIndex: gridColumnIndex,
						rowspan,
						colspan,
						class: [
							getHeaderRowClass(rowIndex),
							getHeaderCellClass(rowIndex, columnIndex, columns, column),
							column.resizable && dragLineClass.value,
							column.stickyClass,
							'vc-table__th'
						],
						style: [
							getHeaderRowStyle(rowIndex),
							getHeaderCellStyle(rowIndex, columnIndex, columns, column),
							column.stickyStyle
						],
						attrs: {
							onMousemove: (e: any) => handleMouseMove(e, column),
							onMouseout: handleMouseOut,
							onMousedown: (e: any) => handleMouseDown(e, column),
							onClick: (e: any) => handleHeaderClick(e, column),
							onContextmenu: (e: any) => handleHeaderContextMenu(e, column)
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
				<div class="vc-table__header">
					<TableMergeLayer
						class={[{ 'is-group': states.isGroup }, 'vc-table__thead']}
						columns={states.columns}
						cells={buildHeaderCells()}
						cellRole="columnheader"
					/>
				</div>
			);
		};
	}
});
