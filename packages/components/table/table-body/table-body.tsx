import { defineComponent, ref, getCurrentInstance, watch, computed, inject, onBeforeMount, onBeforeUnmount } from 'vue';
import { addClass, removeClass } from '@deot/helper-dom';
import { IS_SERVER } from '@deot/vc-shared';
import { raf } from '@deot/helper-utils';
import { RecycleList } from '../../recycle-list';
import { NormalList } from './normal-list';

import { useStates } from '../store';
import { TableBodyMergeRow } from './table-body-merge-row';
import { ScrollerWheel } from '../../scroller/scroller-wheel';

export const TableBody = defineComponent({
	name: 'vc-table-body',
	props: {
		heightStyle: [Object, Array, String]
	},
	emits: ['scroll'],
	setup(props, { emit, expose, slots }) {
		const instance = getCurrentInstance()!;
		const table: any = inject('vc-table');

		const allowRender = ref(false);
		const states: any = useStates({
			data: 'data',
			list: 'list',
			columns: 'columns'
		});

		const target = ref();

		watch(
			() => table.store.states.hoverRowIndex,
			(v, oldV) => {
				// 合并块（grid）没有行容器，hover 高亮按 data-row 作用在 cell 上，也走 JS 控制
				if ((!table.store.states.isComplex && !table.store.states.hasMergeCells) || IS_SERVER) return;
				raf(() => {
					const select = (index: any) => instance.vnode.el!.querySelectorAll(
						`.vc-table__row[data-row="${index}"], .vc-table__merge-cell[data-row="${index}"]`
					);
					select(oldV).forEach((dom: any) => removeClass(dom, 'hover-row'));
					select(v).forEach((dom: any) => addClass(dom, 'hover-row'));
				});
			}
		);

		const handleMergeRowResize = (changes: any[]) => {
			if (table.props.rowHeight) return;
			changes.forEach((v: any) => {
				const block = states.list[v.index];
				// 合并块由 grid 自行撑开行高，块级尺寸不能回写到单行
				if (!block || block.cells) return;
				block.rows.forEach((row: any) => {
					if (row.height === v.size) return;
					row.height = v.size || '';
				});
			});
		};

		expose({ target });
		const layout = table.layout;

		const scrollerOptions = computed(() => ({
			barTo: `.${table.tableId}`,
			native: false,
			always: false,
			showBar: true,
			stopPropagation: true,
			contentClass: 'vc-table__tbody',
			contentStyle: {
				width: layout.states.bodyWidth ? layout.states.bodyWidth + 'px' : ''
			},
			trackOffsetY: [
				layout.states.headerHeight,
				0,
				-layout.states.headerHeight,
				0
			]
		}));

		const renderers = {
			default: ({ row }) => <TableBodyMergeRow store={row} />
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
			if (table.props.height) {
				return (
					<div class={['vc-table__body-wrapper']}>
						<RecycleList
							ref={target}
							data={states.list}
							disabled={true}
							scrollerOptions={scrollerOptions.value}
							pageSize={table.props.rows}
							onScroll={(e: any) => emit('scroll', e)}
							onRowResize={handleMergeRowResize}
							style={props.heightStyle}
						>
							{ renderers }
						</RecycleList>
						{slots.default?.()}
					</div>
				);
			}
			return (
				<ScrollerWheel
					ref={target}
					class="vc-table__body-wrapper"
					{
						...scrollerOptions.value
					}
					style={props.heightStyle}
					onScroll={(e: any) => emit('scroll', e)}
				>
					<NormalList
						data={states.list}
						onRowResize={handleMergeRowResize}
					>
						{ renderers }
					</NormalList>
					{slots.default?.()}
				</ScrollerWheel>
			);
		};
	}
});
