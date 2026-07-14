import { defineComponent, ref, getCurrentInstance, watch, computed, inject, onBeforeMount, onBeforeUnmount } from 'vue';
import { addClass, removeClass } from '@deot/helper-dom';
import { IS_SERVER } from '@deot/vc-shared';
import { raf } from '@deot/helper-utils';
import { RecycleList } from '../../recycle-list';
import { NormalList } from './normal-list';

import { useStates } from '../store';
import { TableBodyBlock } from './table-body-block';
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
		const states = useStates({
			data: 'data',
			list: 'list',
			columns: 'columns'
		});

		const target = ref();

		// hover 高亮走 JS 控制：hover-row 加在 `.vc-table__td[data-row]` cell 上；
		// 行覆盖高亮：rowspan 覆盖当前行的合并 anchor 追加 hover-related（关联路径亮到第一列）。
		watch(
			() => table.store.states.hoverRowIndex,
			(v, oldV) => {
				if (IS_SERVER) return;
				raf(() => {
					const el = instance.vnode.el;
					if (!el) return;
					const selectRow = (index: any) => el.querySelectorAll(
						`.vc-table__td[data-row="${index}"]`
					);
					const selectAnchors = (index: any) => {
						if (index == null) return [];
						return table.store.block.getCoverAnchors(index).reduce((pre: any[], anchor: any) => {
							const dom = el.querySelector(
								`.vc-table__td[data-row="${anchor.rowIndex}"][data-column="${anchor.columnIndex}"]`
							);
							dom && pre.push(dom);
							return pre;
						}, []);
					};
					selectRow(oldV).forEach((dom: any) => removeClass(dom, 'hover-row'));
					selectAnchors(oldV).forEach((dom: any) => removeClass(dom, 'hover-related'));
					selectRow(v).forEach((dom: any) => addClass(dom, 'hover-row'));
					selectAnchors(v).forEach((dom: any) => addClass(dom, 'hover-related'));
				});
			}
		);

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
			default: ({ row }) => <TableBodyBlock store={row} />
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
							batchSize={100}
							onScroll={(e: any) => emit('scroll', e)}
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
					<NormalList data={states.list}>
						{ renderers }
					</NormalList>
					{slots.default?.()}
				</ScrollerWheel>
			);
		};
	}
});
