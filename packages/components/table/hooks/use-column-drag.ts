import { watch } from 'vue';
import type { Ref } from 'vue';
import { clamp } from 'lodash-es';
import type { Nullable } from '@deot/helper-shared';
import { flattenColumnNodes, getAllColumnNodes } from '../store/utils';
import type { Store } from '../store';
import type { TableColumnDropPosition, TableColumnMove } from '../store/modules/drag';
import type { TableColumnNode } from '../table-column/table-column-node';
import type { TableColumnDragPayload, TableColumnDragEndPayload, TableColumnDropPayload } from '../types';
import { INTERACTIVE_SELECTOR, createGhost, createIndicator, getEdgeDelta, scrollBody, toRootOffset, usePointerDrag } from './drag-helpers';
import type { PointerDragState, RootOffset } from './drag-helpers';

type Options = {
	store: Store;
	emit: (event: any, ...args: any[]) => void;
	tableWrapper: Ref<Nullable<HTMLElement>>;
	headerWrapper: Ref<Nullable<HTMLElement>>;
	bottomWrapper: Ref<Nullable<HTMLElement>>;
	bodyXWrapper: Ref<Nullable<HTMLElement>>;
	// 表体的 Scroller 实例：横向滚动交给它以同步滚动条
	bodyScroller: Ref<any>;
	// 表头正在调整列宽（按下列宽拖拽区时由表头置位，先于根节点的按下处理）
	resizing: Ref<boolean>;
};

// 视口坐标下的横向范围
type Range = {
	left: number;
	right: number;
};

// 候选落点：同一父级、同一固定分组的可见普通列（含被拖列自身，停在自身上时顺序不变）及其表头单元格
type Candidate = {
	column: TableColumnNode;
	cell: HTMLElement;
};

// 顺序会变化的落点
type Drop = {
	target: TableColumnNode;
	position: TableColumnDropPosition;
	move: TableColumnMove;
	allowed: boolean;
	// 插入线的横坐标与上端（落点列表头单元格的上缘）
	lineX: number;
	lineTop: number;
};

// 激活后的拖拽会话
type DragSession = {
	// 被拖列的表头单元格：跟随块每帧与它纵向对齐（表头吸顶、页面纵向滚动时随之移动）
	cell: HTMLElement;
	// 按下点距表头单元格左缘的距离，跟随块据此对齐指针
	grabOffset: number;
	ghost: HTMLElement;
	ghostWidth: number;
	indicator: HTMLElement;
	// 被拖列变暗的样式（只作用于本表格）
	style: HTMLStyleElement;
	// 被拖列为非固定列：在滚动区域内命中，靠近边缘时横向滚动；固定列不受滚动区域限制
	scrollable: boolean;
	candidates: Candidate[];
	// 左右固定列与滚动区域的边界单元格（最后一个左固定列、第一个右固定列）
	edges: { left: Nullable<HTMLElement>; right: Nullable<HTMLElement> };
	drop: Nullable<Drop>;
};

// 拖拽状态：source 为被拖动的列（原列节点）
type DragState = PointerDragState<TableColumnNode, DragSession>;

// 表头中不发起列拖拽的元素：排序、筛选、提示图标，以及复选框等交互元素
const HEADER_INTERACTIVE_SELECTOR = `${INTERACTIVE_SELECTOR},.vc-table-sort,.vc-table-filter,.vc-table__tooltip`;

// 拖拽中挂在表格根节点上：限定变暗样式的作用范围
const ROOT_DRAGGING_CLASS = 'is-column-dragging';

// 不限定的范围：固定列只在各自的固定分组内移动，不与滚动区域相交
const UNBOUNDED: Range = { left: -Infinity, right: Infinity };

/**
 * 列拖拽（draggable 第二项），按下到结束的生命周期见 usePointerDrag：
 * 	- 从表头单元格按下（排序、筛选、提示图标、交互元素与列宽拖拽区除外）；
 * 	- 只在同一父级内移动，分组表头连同子列一起移动；顶层不跨固定分组；
 * 	- 激活后被拖列（表头与表体单元格）变暗，竖向插入线标出落点，跟随块（表头单元格的克隆）随指针横向移动，
 * 	  非固定列靠近滚动区域左右边缘时横向滚动表体；
 * 	- 松手时顺序有变化则在表格内部生效，经 update:columns 发出新顺序，再发出 column-drop；之后总会发出 column-dragend。
 * @param options 表格 store、emit 与相关元素
 * @returns 根节点上的按下处理
 */
export const useColumnDrag = (options: Options) => {
	const { store, emit, tableWrapper, headerWrapper, bottomWrapper, bodyXWrapper, bodyScroller, resizing } = options;

	// ---------------------------------------------------------------------
	// 几何
	// ---------------------------------------------------------------------
	/**
	 * 列的表头单元格（类名中带列 id）
	 * @param column 列节点
	 * @returns 表头单元格；未渲染时为 null
	 */
	const getHeaderCell = (column: Nullable<TableColumnNode>) => {
		return (column && headerWrapper.value?.querySelector<HTMLElement>(`.vc-table__th.${column.states.id}`)) || null;
	};

	/**
	 * 表体的横向可见范围
	 * @param body 表体
	 * @returns 左右边界
	 */
	const getBodyRange = (body: HTMLElement): Range => {
		const { left } = body.getBoundingClientRect();
		return { left, right: left + body.clientWidth };
	};

	/**
	 * 非固定列的可见范围：表体可见范围去掉左右固定列
	 * @param session 拖拽会话
	 * @param bodyRange 表体的横向可见范围
	 * @returns 左右边界
	 */
	const getScrollRange = (session: DragSession, bodyRange: Range): Range => {
		const { edges } = session;
		const left = edges.left ? Math.max(bodyRange.left, edges.left.getBoundingClientRect().right) : bodyRange.left;
		const right = edges.right ? Math.min(bodyRange.right, edges.right.getBoundingClientRect().left) : bodyRange.right;
		return { left, right: Math.max(left, right) };
	};

	/**
	 * 命中落点：在候选列中取指针所在（或最近）的列，以其在范围内可见部分的中线区分之前 / 之后
	 * @param current 拖拽状态
	 * @param session 拖拽会话
	 * @param range 命中范围：非固定列为滚动区域（被固定列盖住的部分不算），固定列不限
	 * @returns 落点；顺序不变时为 null
	 */
	const hitTest = (current: DragState, session: DragSession, range: Range): Nullable<Omit<Drop, 'allowed'>> => {
		const x = current.clientX;
		let hit: Nullable<{ column: TableColumnNode; rect: DOMRect; left: number; right: number }> = null;
		let distance = Infinity;
		for (const { column, cell } of session.candidates) {
			const rect = cell.getBoundingClientRect();
			const left = Math.max(rect.left, range.left);
			const right = Math.min(rect.right, range.right);
			if (right <= left) continue;
			const value = x < left ? left - x : x > right ? x - right : 0;
			if (value < distance) {
				distance = value;
				hit = { column, rect, left, right };
			}
		}
		if (!hit) return null;
		const position: TableColumnDropPosition = x < (hit.left + hit.right) / 2 ? 'before' : 'after';
		const move = store.drag.getColumnMove(current.source, hit.column, position);
		if (!move) return null;
		return {
			target: hit.column,
			position,
			move,
			lineX: clamp(position === 'before' ? hit.rect.left : hit.rect.right, range.left, range.right),
			lineTop: hit.rect.top
		};
	};

	// ---------------------------------------------------------------------
	// 插入线、跟随块与变暗
	// ---------------------------------------------------------------------
	/**
	 * 跟随块：表头单元格的克隆，放进 .vc-table__thead 以沿用表头单元格的样式；去掉网格定位与固定列的 sticky
	 * @param root 表格根节点
	 * @param cell 表头单元格
	 * @returns 跟随块
	 */
	const createColumnGhost = (root: HTMLElement, cell: HTMLElement) => {
		const rect = cell.getBoundingClientRect();
		const { ghost, clone } = createGhost(root, cell, 'vc-table__thead', 'is-column');
		Object.assign(clone.style, { position: 'relative', left: '0', right: 'auto', width: '100%', height: '100%' });
		ghost.style.width = `${rect.width}px`;
		ghost.style.height = `${rect.height}px`;
		return ghost;
	};

	/**
	 * 被拖列变暗：表头单元格（分组连同子列，按 id，限定在表头内而不涉及跟随块）与表体、合计行单元格（按 data-column，排除嵌套表格；
	 * getSpan 横向合并时连同跨过该列的合并格），以样式表实现，虚拟滚动新渲染的行同样生效，拖动过程不触发表格重渲染；
	 * 透明度与被拖块一致（--vc-table-dragging-opacity）
	 * @param root 表格根节点
	 * @param column 被拖动的列
	 * @returns 样式元素
	 */
	const createDimmedStyle = (root: HTMLElement, column: TableColumnNode) => {
		const scope = `.vc-table.${ROOT_DRAGGING_CLASS}`;
		const { columns } = store.states;
		const heads = getAllColumnNodes([column]).map(item => `${scope} .vc-table__header-wrapper .vc-table__th.${item.states.id}`);
		const cells = flattenColumnNodes([column])
			.map(leaf => columns.indexOf(leaf))
			.filter(index => index >= 0)
			.flatMap(index => [
				`[data-column="${index}"]`,
				...store.block.getSpansCovering(index).map(({ start, colspan }) => `[data-column="${start}"][aria-colspan="${colspan}"]`)
			])
			.map(attr => `${scope} .vc-table__td${attr}:not(${scope} .vc-table .vc-table__td)`);
		const style = document.createElement('style');
		style.textContent = `${[...heads, ...cells].join(',')}{opacity:var(--vc-table-dragging-opacity)}`;
		root.appendChild(style);
		return style;
	};

	/**
	 * 跟随块随指针横向移动，限制在表体可见范围内；纵向与被拖列的表头单元格对齐
	 * @param current 拖拽状态
	 * @param session 拖拽会话
	 * @param bodyRange 表体的横向可见范围
	 * @param offset 根节点偏移
	 */
	const updateGhost = (current: DragState, session: DragSession, bodyRange: Range, offset: RootOffset) => {
		const left = Math.max(Math.min(current.clientX - session.grabOffset, bodyRange.right - session.ghostWidth), bodyRange.left);
		const { top } = session.cell.getBoundingClientRect();
		session.ghost.style.left = `${left - offset.left}px`;
		session.ghost.style.top = `${top - offset.top}px`;
	};

	/**
	 * 竖向插入线：从落点列表头单元格的上缘到表体的下缘（不盖住吸底的 dock）；顺序不变的落点不显示
	 * @param session 拖拽会话
	 * @param bottom 插入线的下端
	 * @param offset 根节点偏移
	 */
	const updateIndicator = (session: DragSession, bottom: number, offset: RootOffset) => {
		const { indicator: el, drop } = session;
		if (!drop) {
			el.style.display = 'none';
			return;
		}
		el.style.display = '';
		el.style.left = `${drop.lineX - offset.left}px`;
		el.style.top = `${drop.lineTop - offset.top}px`;
		el.style.height = `${Math.max(0, bottom - drop.lineTop)}px`;
		el.classList.toggle('is-disabled', !drop.allowed);
	};

	// ---------------------------------------------------------------------
	// 拖动
	// ---------------------------------------------------------------------
	/**
	 * 按命中结果更新落点；落点与上一帧相同时沿用 allowDrop 的结果（不重复调用）
	 * @param current 拖拽状态
	 * @param session 拖拽会话
	 * @param hit 命中结果
	 */
	const updateDrop = (current: DragState, session: DragSession, hit: Nullable<Omit<Drop, 'allowed'>>) => {
		const { drop } = session;
		if (!hit) {
			session.drop = null;
			return;
		}
		const same = !!drop && drop.target === hit.target && drop.position === hit.position;
		session.drop = {
			...hit,
			allowed: same ? drop!.allowed : store.drag.canDropColumn(current.source, hit.target, hit.position, hit.move)
		};
	};

	/**
	 * 按下位置对应的列：本表格表头单元格，排除交互元素；表头已开始调整列宽时不发起
	 * @param target 按下的元素
	 * @returns 列；不能发起时为 null
	 */
	const resolveSource = (target: HTMLElement) => {
		const root = tableWrapper.value;
		const header = headerWrapper.value;
		if (!store.drag.draggable.value[1] || resizing.value || !root || !header || !target?.closest) return null;

		const cell = target.closest<HTMLElement>('.vc-table__th');
		if (!cell || !header.contains(cell) || cell.closest('.vc-table') !== root) return null;
		const interactive = target.closest(HEADER_INTERACTIVE_SELECTOR);
		if (interactive && cell.contains(interactive)) return null;

		const column = getAllColumnNodes(store.states._columns).find(item => cell.classList.contains(item.states.id));
		if (!column || !store.drag.canDragColumn(column)) return null;
		return { source: column, byHandle: false };
	};

	const activate = (current: DragState) => {
		const root = tableWrapper.value;
		const column = current.source;
		const cell = getHeaderCell(column);
		if (!root || !bodyXWrapper.value || !cell) return null;

		const offset = toRootOffset(root);
		const ghost = createColumnGhost(root, cell);
		const { leftFixedLeafColumns: left, rightFixedLeafColumns: right } = store.states;
		const candidates = store.column.getSiblings(column.parentNode)
			.filter(item => item === column || store.drag.isColumnTarget(column, item))
			.map(item => ({ column: item, cell: getHeaderCell(item) }))
			.filter((item): item is Candidate => !!item.cell);
		const session: DragSession = {
			cell,
			grabOffset: current.startX - cell.getBoundingClientRect().left,
			ghost,
			ghostWidth: ghost.offsetWidth,
			indicator: createIndicator(root, 'is-vertical'),
			style: createDimmedStyle(root, column),
			scrollable: !store.drag.getColumnSide(column),
			candidates,
			edges: { left: getHeaderCell(left[left.length - 1]), right: getHeaderCell(right[0]) },
			drop: null
		};
		// 立即定位，避免跟随块在下一帧之前出现在默认位置
		updateGhost(current, session, getBodyRange(bodyXWrapper.value), offset);
		root.classList.add(ROOT_DRAGGING_CLASS);
		store.states.dragging = true;
		return session;
	};

	const start = (current: DragState) => {
		emit('column-dragstart', store.drag.getColumnPayload(current.source) satisfies TableColumnDragPayload);
	};

	/**
	 * 每帧：非固定列靠近边缘时自动滚动，再按指针位置更新落点、跟随块与插入线（先读后写）
	 * @param current 拖拽状态
	 * @param session 拖拽会话
	 * @returns 仍在滚动时为 true（继续下一帧）
	 */
	const update = (current: DragState, session: DragSession) => {
		const root = tableWrapper.value;
		const body = bodyXWrapper.value;
		if (!root || !body) return false;
		const bodyRect = body.getBoundingClientRect();
		const bodyRange = { left: bodyRect.left, right: bodyRect.left + body.clientWidth };
		const range = session.scrollable ? getScrollRange(session, bodyRange) : UNBOUNDED;
		const delta = session.scrollable ? getEdgeDelta(current.clientX, range.left, range.right) : 0;
		const scrolled = !!delta && scrollBody(body, bodyScroller.value, 'x', delta);

		updateDrop(current, session, hitTest(current, session, range));
		const dock = bottomWrapper.value?.getBoundingClientRect();
		const bottom = dock && dock.height > 0 ? Math.min(bodyRect.bottom, dock.top) : bodyRect.bottom;
		const offset = toRootOffset(root);
		updateGhost(current, session, bodyRange, offset);
		updateIndicator(session, bottom, offset);
		return scrolled;
	};

	/**
	 * 结束拖拽（激活过的）：移除跟随块、插入线与变暗样式；commit 且允许放置时在表格内部生效并发出事件
	 * @param current 拖拽状态
	 * @param session 拖拽会话
	 * @param commit 是否按当前落点提交
	 */
	const finish = (current: DragState, session: DragSession, commit: boolean) => {
		const column = current.source;
		const payload = store.drag.getColumnPayload(column);
		session.ghost.remove();
		session.indicator.remove();
		session.style.remove();
		tableWrapper.value?.classList.remove(ROOT_DRAGGING_CLASS);
		store.states.dragging = false;

		const { drop } = session;
		let dropped = false;
		if (commit && drop?.allowed) {
			const dropPayload = store.drag.getColumnDropPayload(column, drop.target, drop.position, drop.move);
			// 内部生效并经 update:columns 发出新顺序
			const columns = store.column.move(drop.move);
			emit('column-drop', { ...dropPayload, columns } satisfies TableColumnDropPayload);
			dropped = true;
		}
		emit('column-dragend', { ...payload, dropped } satisfies TableColumnDragEndPayload);
	};

	const drag = usePointerDrag({ root: tableWrapper, resolve: resolveSource, activate, start, update, finish });

	// 拖拽期间列变化（增删、隐藏、外部写回顺序）：取消
	watch(() => store.states.originColumns, drag.cancel);

	return {
		handleMousedown: drag.handleMousedown,
		handleTouchstart: drag.handleTouchstart
	};
};
