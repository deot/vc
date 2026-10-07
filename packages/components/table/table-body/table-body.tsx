import { defineComponent, ref, getCurrentInstance, computed, inject, camelize } from 'vue';
import type { Nullable } from '@deot/helper-shared';
import { RecycleList } from '../../recycle-list';
import { NormalList } from './normal-list';

import { useStates } from '../store';
import { parseHeight, getRowHeight } from '../utils';
import { RECYCLE_LIST_RESERVED_KEYS } from '../table-props';
import { getColumnLine } from '../table-column/table-column-config';
import { useRowHover, resolveCellEl } from '../hooks/use-row-hover';
import { useTextLineTooltip } from '../hooks/use-text-line-tooltip';
import { TableBodyBlock } from './table-body-block';
import { Scroller } from '../../scroller/scroller';
import type { TableCellEventPayload } from '../types';

export const TableBody = defineComponent({
	name: 'vc-table-body',
	props: {
		heightStyle: [Object, Array, String]
	},
	emits: ['scroll', 'load-change'],
	setup(props, { emit, expose, slots }) {
		const instance = getCurrentInstance()!;
		const table: any = inject('vc-table');

		const states = useStates({
			list: 'list'
		});

		const target = ref();

		// ---------------------------------------------------------------------
		// 表体级事件委托：整个表体只挂一组监听，块（TableBodyBlock）只负责渲染
		// ---------------------------------------------------------------------
		const getRoot = () => {
			const el = instance.vnode.el;
			return el?.nodeType === 1 ? el as HTMLElement : null;
		};
		const hover = useRowHover(table, getRoot);
		const textLineTooltip = useTextLineTooltip();

		/**
		 * 单元格事件的参数（同一次操作的 cell-* 与 row-* 共用一个对象）
		 *
		 * 行号、列号取自单元格的 data-row / data-column：行号即 renderData 的下标（树形表格为铺平后的可见行）
		 * @param cell 单元格元素
		 * @param e 委托在表体根节点上的事件
		 * @returns 事件参数；行或列已不存在时为 null
		 */
		const toPayload = (cell: Nullable<HTMLElement>, e: MouseEvent): Nullable<TableCellEventPayload> => {
			if (!cell) return null;
			const rowIndex = Number(cell.dataset.row);
			const columnIndex = Number(cell.dataset.column);
			const row = table.store.states.renderData[rowIndex];
			const column = table.store.states.columns[columnIndex]?.states;
			return row && column ? { row, rowIndex, column, columnIndex, cell, event: e } : null;
		};
		const resolveCell = (e: MouseEvent) => toPayload(resolveCellEl(e.target as Element, e.currentTarget as Element), e);

		// mouseover 冒泡 + 前后 cell 比较，合成 enter/leave 语义
		let activeCell: Nullable<TableCellEventPayload> = null;
		const leaveCell = (e: MouseEvent) => {
			if (!activeCell) return;
			table.emit('cell-mouseleave', { ...activeCell, event: e });
			activeCell = null;
		};

		const handleMouseOver = (e: MouseEvent) => {
			// 拖拽排序中不做 hover 高亮，也不弹出省略提示
			if (table.store.states.dragging) return;
			const cellEl = resolveCellEl(e.target as Element, e.currentTarget as Element);
			if (cellEl && cellEl === activeCell?.cell) return;
			leaveCell(e);
			const cell = toPayload(cellEl, e);
			// 移到单元格以外（展开行的内容、空白处）
			if (!cell) return hover.leave();
			activeCell = cell;
			hover.enter(cell.cell);
			table.emit('cell-mouseenter', cell);
			// 多行省略被截断时展示完整内容
			textLineTooltip.open(cell.cell.querySelector('.vc-table__text-line'), getColumnLine(cell.column, 'line'), cell.cell);
		};

		const handleMouseLeave = (e: MouseEvent) => {
			leaveCell(e);
			hover.leave(true);
		};

		const handleEvent = (e: MouseEvent, name: string) => {
			const cell = resolveCell(e);
			if (!cell) return;
			name === 'click' && table.store.row.set(cell.row);
			table.emit(`cell-${name}`, cell);
			table.emit(`row-${name}`, cell);
		};

		const listeners = {
			onClick: (e: MouseEvent) => handleEvent(e, 'click'),
			onDblclick: (e: MouseEvent) => handleEvent(e, 'dblclick'),
			onContextmenu: (e: MouseEvent) => handleEvent(e, 'contextmenu'),
			onMouseover: handleMouseOver,
			onMouseleave: handleMouseLeave,
			onMousemove: hover.track
		};

		expose({ target });
		const layout = table.layout;

		const scrollerOptions = computed(() => {
			// 流式高度下表体没有纵向溢出：横向滚动条挂到底部 dock 的锚点，随 dock 吸底
			// 传元素而非 selector：dock 随 affix 切换重建时跟随新锚点，也不会匹配到嵌套表格的锚点
			const fluid = !table.props.height && !table.props.maxHeight;
			const barAnchor = table.barAnchor.value;
			// 固定高度下轨道挂在表格根节点：横向轨道上移到合计行上方（合计行有 -1px 的上外边距），与流式高度一致
			const { footerHeight } = layout.states;
			return {
				trackOffsetX: [0, 0, fluid ? 0 : Math.max(footerHeight - 1, 0), 0],
				barTo: fluid ? barAnchor : `.${table.tableId}`,
				// 悬停整个表格（含已吸底的 dock）时显示滚动条
				barTriggerElement: `.${table.tableId}`,
				// 滚轮驱动：表头、固定列与表体在同一帧更新
				wheel: true,
				native: false,
				always: false,
				// 锚点就绪前不渲染，避免轨道先落在表体内
				showBar: !fluid || !!barAnchor,
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
			};
		});

		/**
		 * 行高已知时块的尺寸可以直接算出：虚拟列表跳过隐藏池测量，一次构建全部行；合并块按行数计。
		 * 行高是函数时取块内各行之和，任一行没给出高度，整块照常测量。
		 * 展开行的内容高度事先不可知，与渲染后才展开的行一样，由渲染出来后的实测校正。
		 * 虚拟列表的数据项（row）是内部的渲染块，不对外暴露
		 */
		const estimateSize = computed(() => {
			const { rowHeight } = table.props;
			if (typeof rowHeight !== 'function') {
				const height = parseHeight(rowHeight);
				return height ? ({ row: block }: { row: any }) => block.rows.length * height : void 0;
			}
			return ({ row: block }: { row: any }) => {
				let size = 0;
				for (const { data, index } of block.rows) {
					const height = getRowHeight(rowHeight, data, index);
					if (!height) return void 0;
					size += height;
				}
				return size;
			};
		});

		// 透传给 RecycleList 的属性：Table 的默认批次可被覆盖；保留键与事件被忽略（键名按 camelCase 比较，兼容 'buffer-count' 写法）
		const recycleListOptions = computed(() => {
			const options = table.props.recycleListOptions || {};
			return Object.keys(options).reduce((pre, key) => {
				const name = camelize(key);
				if (!(RECYCLE_LIST_RESERVED_KEYS as readonly string[]).includes(name) && !/^on[A-Z]/.test(name)) {
					pre[name] = options[key];
				}
				return pre;
			}, { batchCount: 100 } as Record<string, unknown>);
		});

		const renderers = {
			default: ({ row }) => <TableBodyBlock store={row} />
		};

		return () => {
			const externalVirtualized = !table.props.height
				&& !table.props.maxHeight
				&& table.props.virtualized;
			if (table.props.height || externalVirtualized) {
				return (
					<div class="vc-table__body-wrapper" {...listeners}>
						<RecycleList
							{...recycleListOptions.value}
							ref={target}
							data={states.list}
							disabled={true}
							fill={!externalVirtualized}
							scrollerOptions={scrollerOptions.value}
							estimateSize={estimateSize.value}
							onScroll={(e: any) => emit('scroll', e)}
							onLoadChange={(v: any) => emit('load-change', v)}
							onRowResize={externalVirtualized
								? table.refreshAffix
								: undefined}
							style={props.heightStyle}
						>
							{ renderers }
						</RecycleList>
						{slots.default?.()}
					</div>
				);
			}
			return (
				<Scroller
					ref={target}
					class="vc-table__body-wrapper"
					{
						...scrollerOptions.value
					}
					style={props.heightStyle}
					onScroll={(e: any) => emit('scroll', e)}
					{...listeners}
				>
					<NormalList data={states.list}>
						{ renderers }
					</NormalList>
					{slots.default?.()}
				</Scroller>
			);
		};
	}
});
