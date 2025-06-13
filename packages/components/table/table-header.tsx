import { defineComponent, ref, getCurrentInstance, computed, inject } from 'vue';
import { addClass, removeClass, hasClass } from '@deot/helper-dom';
import { IS_SERVER } from '@deot/vc-shared';
import { Popover } from '../popover';
import { Icon } from '../icon';
import { useStates } from './store';
// import TableSort from './table-sort';
// import TableFilter from './table-filter';

const TableSort = 'div';
const TableFilter = 'div';

export const TableHeader = defineComponent({
	name: 'vc-table-header',
	props: {
		fixed: [Boolean, String],
		border: Boolean,
		// 排序全部交给外部处理，内部不处理数据，只做交互
		defaultSort: {
			type: Object,
			default: () => ({})
		}
	},

	setup(props) {
		const table: any = inject('vc-table');
		const instance = getCurrentInstance()!;

		const draggingColumn = ref(null);
		const dragging = ref(false);
		const dragState = ref<any>({});

		const states: any = useStates({
			columns: 'columns',
			isAllSelected: 'isAllSelected',
			leftFixedLeafCount: 'leftFixedLeafColumnsLength',
			rightFixedLeafCount: 'rightFixedLeafColumnsLength',
			isGroup: 'isGroup',
			headerRows: 'headerRows',
			columnsCount: $states => $states.columns.length,
			leftFixedCount: $states => $states.leftFixedColumns.length,
			rightFixedCount: $states => $states.rightFixedColumns.length
		});

		const isColumnHidden = (index: number) => {
			let start = 0;
			for (let i = 0; i < index; i++) {
				start += states.columns[i].colSpan;
			}
			const after = start + states.columns[index].colSpan - 1;
			if (props.fixed === true || props.fixed === 'left') {
				return after >= states.leftFixedLeafCount;
			} else if (props.fixed === 'right') {
				return start < states.columnsCount - states.rightFixedLeafCount;
			} else {
				return (after < states.leftFixedLeafCount) || (start >= states.columnsCount - states.rightFixedLeafCount);
			}
		};

		const columnsHidden = computed(() => {
			return states.columns.map((_: any, index: number) => isColumnHidden(index));
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
			return headerCellStyle;
		};

		const getHeaderCellClass = (rowIndex: number, columnIndex: number, row: any, column: any) => {
			const classes = [column.id, column.order, column.realHeaderAlign, column.className, column.labelClass];

			if (rowIndex === 0 && columnsHidden.value[columnIndex]) {
				classes.push('is-hidden');
			}

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
			if (draggingColumn.value && props.border) {
				dragging.value = true;

				table.resizeProxyVisible.value = true;

				const tableEl = table.vnode.el;
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
						column.width = columnWidth;
						column.realWidth = column.width;
						table.$emit('header-dragend', column.width, startLeft - startColumnLeft, column, event);

						table.store.scheduleLayout();

						document.body.style.cursor = '';
						dragging.value = false;
						draggingColumn.value = null;
						dragState.value = {};

						table.resizeProxyVisible = false;
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

			if (!dragging.value && props.border) {
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
			table.emit('sort-change', { prop, order });
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

		return () => {
			return (
				<div class="vc-table__header">
					<div class={[{ 'is-group': states.isGroup }, 'vc-table__thead']}>
						{
							// renderList
							states.headerRows.map((columns: any[], rowIndex: number) => (
								<div
									style={getHeaderRowStyle(rowIndex)}
									class={[getHeaderRowClass(rowIndex), 'vc-table__tr']}
								>
									{
										columns.map((column: any, columnIndex: number) => (
											<div
												onMousemove={(e: any) => handleMouseMove(e, column)}
												onMouseout={handleMouseOut}
												onMousedown={(e: any) => handleMouseDown(e, column)}
												onClick={(e: any) => handleHeaderClick(e, column)}
												onContextmenu={(e: any) => handleHeaderContextMenu(e, column)}
												style={[
													getHeaderCellStyle(rowIndex, columnIndex, columns, column),
													{ width: `${column.realWidth}px` }
												]}
												class={[
													getHeaderCellClass(rowIndex, columnIndex, columns, column),
													'vc-table__th'
												]}
												key={column.id}
											>
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
																		onMouseenter={(e: any) => handleCellMouseEnter(e, column)}
																	/>
																)
															: null
													}
													{
														column.sortable
															? (
																	<TableSort
																		order={column.prop === props.defaultSort.prop ? props.defaultSort.order : ''}
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
											</div>
										))
									}
								</div>
							))
						}
					</div>
				</div>
			);
		};
	}
});
