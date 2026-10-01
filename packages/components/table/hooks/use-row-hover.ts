import { onBeforeUnmount, watch } from 'vue';
import type { Nullable } from '@deot/helper-shared';
import { raf } from '@deot/helper-utils';
import { debounce } from 'lodash-es';
import { IS_SERVER } from '@deot/vc-shared';
import { SCROLL_IDLE, isScrollOf, useScrollListener } from '../../scroller/scroll-idle';
import type { TableProvide } from '../types';

// 鼠标停留多久才高亮（ms）：快速划过不逐行闪
const HOVER_DELAY = 30;

/**
 * 从节点向上找属于本表体的单元格
 *
 * 嵌套表格里的格子最近的表体不是本表，继续向上，落到外层表格的单元格上；
 * 展开行的内容格不在块的 grid 里，不算单元格
 * @param target 起点（事件目标、鼠标下的元素）
 * @param root 表体根节点
 * @returns 单元格元素；不在单元格上时为 null
 */
export const resolveCellEl = (target: Nullable<Element>, root: Element): Nullable<HTMLElement> => {
	let el = target?.closest?.('.vc-table__td') as Nullable<HTMLElement>;
	while (el && el.closest('.vc-table__body-wrapper') !== root) {
		el = el.parentElement?.closest('.vc-table__td') as Nullable<HTMLElement>;
	}
	return el?.parentElement?.classList.contains('vc-table__grid') ? el : null;
};

/**
 * 行的悬停高亮（每个 Table 一份）
 * 	- hover-row 加在该行的 cell 上；rowspan 覆盖该行的合并锚点追加 hover-related（关联路径亮到第一列）；
 * 	- 只在命中的块内找格子：合并按块切分，覆盖该行的锚点与它在同一个块里，不必扫整个表体与隐藏测量池；
 * 	- 滚动期间不高亮：行从静止的鼠标下经过时不逐行闪。停止 SCROLL_IDLE 后恢复，并按鼠标位置补上高亮；
 * 	  单元格事件照常触发，省略提示自己会等滚动停下。
 * @param table Table 提供的上下文
 * @param getRoot 表体根节点
 * @returns enter / leave / track
 */
export const useRowHover = (table: TableProvide, getRoot: () => Nullable<HTMLElement> | undefined) => {
	const { store } = table;

	// 鼠标所在的块：高亮时优先在它里面找，不必查询整个表体
	let hint: Nullable<HTMLElement> = null;
	let highlighted: Element[] = [];
	let isScrolling = false;
	const pointer = { x: -1, y: -1 };

	const clear = () => {
		highlighted.forEach(el => el.classList.remove('hover-row', 'hover-related'));
		highlighted = [];
	};

	// 行所在的块：鼠标移入时已知；程序设置 hoverRowIndex 时按块的起始行查找（排除嵌套表格里同号的块；测量池里的块不带 data-row-start）
	const findGrid = (rowIndex: number) => {
		const root = getRoot();
		const block = store.drag.getBlockByRowIndex(rowIndex);
		if (!root || !block) return null;
		if (hint?.isConnected && Number(hint.dataset.rowStart) === block.rowStart) return hint;
		return Array.from(root.querySelectorAll(`.vc-table__grid[data-row-start="${block.rowStart}"]`))
			.find(grid => grid.closest('.vc-table__body-wrapper') === root);
	};

	const apply = (rowIndex: Nullable<number>) => {
		clear();
		const grid = rowIndex == null ? null : findGrid(rowIndex);
		if (!grid) return;
		const anchors: { rowIndex: number; columnIndex: number }[] = store.block.getCoverAnchors(rowIndex!);
		// 单元格是 grid 的直接子节点：不会碰到单元格里嵌套表格的格子
		Array.from(grid.children).forEach((el) => {
			const row = Number((el as HTMLElement).dataset.row);
			const column = Number((el as HTMLElement).dataset.column);
			const name = row === rowIndex
				? 'hover-row'
				: anchors.some(anchor => anchor.rowIndex === row && anchor.columnIndex === column) && 'hover-related';
			if (!name) return;
			el.classList.add(name);
			highlighted.push(el);
		});
	};

	// 高亮跟随 hoverRowIndex：鼠标移入、表格移出与拖拽开始时的清空、外部直接设置都走这里
	watch(
		() => store.states.hoverRowIndex,
		v => IS_SERVER || raf(() => apply(v))
	);

	// 移入、移出共用一个延时：后一次覆盖前一次
	const setHoverIndex = debounce((rowIndex: Nullable<number>) => store.row.setHoverIndex(rowIndex), HOVER_DELAY);

	/**
	 * 鼠标移入单元格
	 * @param cellEl 单元格元素
	 */
	const enter = (cellEl: HTMLElement) => {
		if (isScrolling) return;
		hint = cellEl.parentElement;
		setHoverIndex(Number(cellEl.dataset.row));
	};

	/**
	 * 鼠标移出单元格
	 * @param isOutside 是否移出了整个表体：之后不再按鼠标位置补高亮
	 */
	const leave = (isOutside = false) => {
		hint = null;
		isOutside && (pointer.x = -1);
		setHoverIndex(null);
	};

	// 记下鼠标位置：滚动停下后按它找回鼠标下的行
	const track = (e: MouseEvent) => {
		pointer.x = e.clientX;
		pointer.y = e.clientY;
	};

	const resume = debounce(() => {
		isScrolling = false;
		const root = getRoot();
		const cellEl = !root || pointer.x < 0 ? null : resolveCellEl(document.elementFromPoint?.(pointer.x, pointer.y), root);
		cellEl && enter(cellEl);
	}, SCROLL_IDLE);

	useScrollListener((target) => {
		const root = getRoot();
		// 拖拽排序中不处理：拖拽自己会带动滚动，命中判断不依赖悬停；已停用（KeepAlive）的表格也不处理
		if (!root?.isConnected || store.states.dragging) return;
		// 带动了行的滚动才算：页面、外层容器、表体自己的滚动容器；单元格里的滚动区域不算
		const wrapper = table.bodyXWrapper.value;
		if (!wrapper || !isScrollOf(target, wrapper)) return;
		if (!isScrolling) {
			isScrolling = true;
			hint = null;
			setHoverIndex.cancel();
			store.row.setHoverIndex(null);
		}
		resume();
	});

	onBeforeUnmount(() => {
		setHoverIndex.cancel();
		resume.cancel();
	});

	return { enter, leave, track };
};
