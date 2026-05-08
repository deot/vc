import { defineComponent, ref, getCurrentInstance, watch, computed, inject, onBeforeMount, onBeforeUnmount } from 'vue';
import { addClass, removeClass } from '@deot/helper-dom';
import { IS_SERVER } from '@deot/vc-shared';
import { raf } from '@deot/helper-utils';
import { RecycleList } from '../../recycle-list';
import { NormalList } from './normal-list';

import { useStates } from '../store';
import { TableBodyMergeRow } from './table-body-merge-row';

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

		const wrapper = ref();

		watch(
			() => table.store.states.hoverRowIndex,
			(v, oldV) => {
				if (!table.store.states.isComplex || IS_SERVER) return;
				raf(() => {
					const oldRow = instance.vnode.el!.querySelector(`.vc-table__row[data-row="${oldV}"]`);
					const newRow = instance.vnode.el!.querySelector(`.vc-table__row[data-row="${v}"]`);
					oldRow && removeClass(oldRow, 'hover-row');
					newRow && addClass(newRow, 'hover-row');
				});
			}
		);

		const handleMergeRowResize = (changes: any[]) => {
			if (table.props.rowHeight) return;
			// 批量处理所有尺寸变化
			changes.forEach((v: any) => {
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
			});
		};

		expose({
			wrapper,
			getRootElement: () => instance.vnode.el
		});
		const layout = table.layout;

		const scrollerOptions = computed(() => ({
			barTo: `.${table.tableId}`,
			native: false,
			always: false,
			showBar: !props.fixed,
			stopPropagation: !props.fixed,
			trackOffsetY: [
				layout.states.headerHeight,
				0,
				-layout.states.headerHeight - layout.states.footerHeight + 2,
				0
			]
		}));

		const renderers = {
			default: ({ row }) => <TableBodyMergeRow store={row} columnsHidden={columnsHidden.value} />
		};

		let timer: any;
		onBeforeMount(() => {
			if (table.props.delay) {
				timer = setTimeout(() => allowRender.value = true, table.props.delay);
			} else {
				allowRender.value = true;
			}
		});
		onBeforeUnmount(() => {
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
										scrollerOptions={scrollerOptions.value}
										pageSize={table.props.rows}
										onScroll={(e: any) => emit('scroll', e)}
										onRowResize={handleMergeRowResize}
										style={props.heightStyle}
									>
										{ renderers }
									</RecycleList>
								)
							: (
									<NormalList
										data={states.list}
										onRowResize={handleMergeRowResize}
									>
										{ renderers }
									</NormalList>
								)
					}
				</div>
			);
		};
	}
});
