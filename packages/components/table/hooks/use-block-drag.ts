import { watch, inject, toRaw } from 'vue';
import type { Ref } from 'vue';
import { getScroller } from '@deot/helper-dom';
import type { Nullable } from '@deot/helper-shared';
import { SCROLLER_REG } from '../../scroller/utils';
import { isWindow } from '../../recycle-list/viewport/external/dom';
import { ExternalCarrier } from '../../recycle-list/viewport/external/carrier';
import { bisectFirst } from '../../recycle-list/store/position';
import type { AxisKeys, InjectedScroller } from '../../recycle-list/viewport/types';
import type { Store } from '../store';
import type { TableDropPosition, TableMove } from '../store/modules';
import type { Props } from '../table-props';
import type { TableBlockDragPayload, TableBlockDragEndPayload, TableBlockDropPayload } from '../types';
import { clamp } from 'lodash-es';
import {
	INTERACTIVE_SELECTOR,
	createGhost,
	createIndicator,
	getEdgeDelta,
	getNextOffset,
	scrollBody,
	toRootOffset,
	usePointerDrag
} from './drag-helpers';
import type { PointerDragState, RootOffset } from './drag-helpers';

type Options = {
	props: Props;
	store: Store;
	emit: (event: any, ...args: any[]) => void;
	tableWrapper: Ref<Nullable<HTMLElement>>;
	headerWrapper: Ref<Nullable<HTMLElement>>;
	bottomWrapper: Ref<Nullable<HTMLElement>>;
	bodyXWrapper: Ref<Nullable<HTMLElement>>;
	// 表体的 Scroller 实例（设置了 height / maxHeight 时承载纵向滚动）
	bodyScroller: Ref<any>;
	// 表体为虚拟列表（RecycleList）：滚动时块节点随之增删
	virtual: Ref<boolean>;
};

// 命中的落点；顺序不变时 move 为 null
type Hit = {
	// 落点行：非树形表格为落点块的行；树形表格为 before / after 所相对的行，inner 时为新的父行
	targetRows: any[];
	position: TableDropPosition;
	move: Nullable<TableMove>;
	// 命中块的纵向范围：inner 时插入线改为框住它
	rect: Range;
	// 插入线的纵坐标与左端（树形表格按层级缩进；null 时为表体左缘）
	lineY: number;
	lineLeft: Nullable<number>;
	// 指针停在其中间区域的收起节点（树形表格）：停留片刻后自动展开
	expandRow: any;
};

// 顺序会变化的落点
type Drop = Hit & {
	move: TableMove;
	allowed: boolean;
};

// 树形表格：被拖行连同可见的子孙在可见行中的范围 [start, end]
type TreeSession = {
	start: number;
	end: number;
	// 树形列单元格的左内边距（首次测量后缓存）
	padding: Nullable<number>;
};

// 视口坐标下的纵向范围
type Range = {
	top: number;
	bottom: number;
};

// 表体可见范围；clipped 为表体在该方向是否被外部滚动视口遮住（流式高度、表格大于视口）
type VisibleRect = Range & {
	left: number;
	width: number;
	clippedTop: boolean;
	clippedBottom: boolean;
};

// 激活后的拖拽会话
type DragSession = {
	// 按下点距块顶部的距离，跟随行据此对齐指针
	grabOffset: number;
	ghost: HTMLElement;
	ghostHeight: number;
	indicator: HTMLElement;
	// 表格外的纵向滚动承载者：流式高度下由它承载滚动
	outer: ExternalCarrier;
	// 已渲染的块根节点：非虚拟表格在块列表变化前不变，查询一次后缓存；虚拟表格为 null，每帧查询
	blockEls: Nullable<HTMLElement[]>;
	// 变暗的块：被拖块，树形表格还包括可见的子孙行
	dimmed: any[];
	// 树形表格的拖拽信息；非树形表格为 null
	tree: Nullable<TreeSession>;
	drop: Nullable<Drop>;
	// 悬停自动展开：指针停留的收起节点与计时
	hover: { row: any; timer: any };
};

// 拖拽状态：source 为被拖动的块（states.list 中的块）
type DragState = PointerDragState<any, DragSession>;

// 树形表格：指针在收起节点的中间区域停留（ms）后自动展开
const HOVER_EXPAND = 600;

// 外部滚动承载者的纵向属性名
const Y_KEYS: AxisKeys = {
	axis: 'y',
	scrollAxis: 'scrollTop',
	clientSize: 'clientHeight',
	scrollSize: 'scrollHeight',
	offsetSize: 'offsetHeight'
};

/**
 * 拖拽排序（以块为单位），按下到结束的生命周期见 usePointerDrag：
 * 	- 整行拖拽（draggable 第一项）从单元格任意位置按下，锚点拖拽从 `.vc-table__drag-handle`（type="drag" 列）按下；
 * 	- 激活后源块变暗，插入线标出落点，跟随行（块 grid 的克隆）随指针纵向移动，指针靠近边缘时自动滚动；
 * 	- 松手时顺序有变化则发出 update:data（新数组）与 block-drop，树形表格先原地修改；之后总会发出 block-dragend；
 * 	- 插入线、跟随行均为命令式 DOM，拖动过程不触发表格重渲染。
 * @param options 表格 props、store、emit 与相关元素
 * @returns 根节点上的按下处理
 */
export const useBlockDrag = (options: Options) => {
	const { props, store, emit, tableWrapper, headerWrapper, bottomWrapper, bodyXWrapper, bodyScroller, virtual } = options;
	// 外层的 VC Scroller：外部滚动承载者恰好是它时，滚动交给它以同步其滚动条
	const injected = inject<InjectedScroller | undefined>('vc-scroller', undefined);

	// ---------------------------------------------------------------------
	// 几何
	// ---------------------------------------------------------------------
	/**
	 * 本表格已渲染的块根节点（按 DOM 顺序，排除嵌套表格与虚拟列表的测量池）
	 * @returns 块根节点
	 */
	const queryBlockEls = () => {
		const body = bodyXWrapper.value;
		const root = tableWrapper.value;
		if (!body || !root) return [];
		return Array.from(body.querySelectorAll<HTMLElement>('[data-row-start]'))
			.filter(el => el.closest('.vc-table') === root && (!virtual.value || !el.closest('.vc-recycle-list__pool')));
	};

	/**
	 * 块的纵向范围：含紧随其后的展开行
	 * @param el 块根节点
	 * @returns 上下边界
	 */
	const getBlockRect = (el: HTMLElement): Range => {
		const rect = el.getBoundingClientRect();
		let bottom = rect.bottom;
		let next = el.nextElementSibling as Nullable<HTMLElement>;
		while (next && next.classList.contains('is-expanded')) {
			bottom = Math.max(bottom, next.getBoundingClientRect().bottom);
			next = next.nextElementSibling as Nullable<HTMLElement>;
		}
		return { top: rect.top, bottom };
	};

	/**
	 * 表格外纵向滚动的承载者：从表格向上找纵向可滚动的祖先（VC Scroller 按类名识别），找不到时为窗口。
	 * 当前纵向不可滚动的祖先跳过，如只横向滚动的包裹元素（overflow-x 非 visible 时 overflow-y 的计算值为 auto）
	 * @param root 表格根节点
	 * @returns 承载者
	 */
	const resolveOuter = (root: HTMLElement) => {
		let el = root.parentElement;
		while (el) {
			const target = getScroller(el, { direction: 'y', className: SCROLLER_REG });
			if (!target || isWindow(target)) break;
			if (target.scrollHeight > target.clientHeight) {
				return new ExternalCarrier(target, injected?.wrapper === target ? injected : undefined, Y_KEYS);
			}
			el = target.parentElement;
		}
		return new ExternalCarrier(window, undefined, Y_KEYS);
	};

	/**
	 * 外部滚动承载者的视口（与窗口取交集）
	 * @param outer 外部滚动承载者
	 * @returns 纵向范围
	 */
	const getOuterViewport = (outer: ExternalCarrier): Range => {
		const top = outer.contentOrigin;
		return {
			top: Math.max(0, top),
			bottom: Math.min(window.innerHeight, top + outer.clientSize)
		};
	};

	/**
	 * 表体的可见范围：表体视口与外部滚动视口的交集，并去掉吸顶表头、吸底 dock 遮住的部分
	 * （未吸附时表头在表体之上、dock 在表体之下，取最大 / 最小值不受影响）
	 * @param outer 外部滚动承载者
	 * @returns 可见范围；表体不存在时为 null
	 */
	const getVisibleRect = (outer: ExternalCarrier): Nullable<VisibleRect> => {
		const body = bodyXWrapper.value;
		if (!body) return null;
		const rect = body.getBoundingClientRect();
		const viewport = getOuterViewport(outer);
		let top = Math.max(rect.top, viewport.top);
		let bottom = Math.min(rect.bottom, viewport.bottom);
		if (headerWrapper.value) {
			top = Math.max(top, headerWrapper.value.getBoundingClientRect().bottom);
		}
		if (bottomWrapper.value) {
			const dock = bottomWrapper.value.getBoundingClientRect();
			// dock 为空（无横向滚动条、无合计行）时高度为 0，不参与计算
			dock.height > 0 && (bottom = Math.min(bottom, dock.top));
		}
		return {
			top,
			bottom: Math.max(top, bottom),
			left: rect.left,
			width: body.clientWidth,
			clippedTop: rect.top < viewport.top - 0.5,
			clippedBottom: rect.bottom > viewport.bottom + 0.5
		};
	};

	// 可见行的行数据与层级（树形表格每行一块）
	const getRowAt = (index: number) => {
		const block = store.drag.getBlockByRowIndex(index);
		return block ? { row: block.rows[0].data, level: block.rows[0].level || 0 } : null;
	};

	/**
	 * 树形列在该行中的内容起点，即层级 0 的展开图标左缘（各层级依次缩进 indent）
	 * @param tree 树形表格的拖拽信息
	 * @param el 块根节点
	 * @returns 内容起点；没有树形列时为 null
	 */
	const getTreeContentLeft = (tree: TreeSession, el: HTMLElement) => {
		const column = store.states.treeColumnIndex;
		if (column < 0) return null;
		const cell = el.querySelector<HTMLElement>(`:scope > .vc-table__td[data-column="${column}"] > .vc-table__cell`);
		if (!cell) return null;
		tree.padding ??= parseFloat(getComputedStyle(cell).paddingLeft) || 0;
		return cell.getBoundingClientRect().left + tree.padding;
	};

	/**
	 * 树形表格的命中：
	 * 	- 落在被拖子树内：不可放置；
	 * 	- 行的中间一半为 inner（成为子行，追加到末尾），框住目标行；不能作为 inner 的行（未加载的懒加载节点）按上下两半；
	 * 	- 上 / 下区域落在与相邻行之间的间隙（跳过被拖子树）。间隙可以接在下方行到上方行之间的任一层级，
	 * 	  由指针在树形列上的横向位置决定：层级等于下方行时放在它之前，否则放在上方行对应层级的祖先之后
	 * @param block 被拖动的块
	 * @param tree 树形表格的拖拽信息
	 * @param el 命中的块根节点
	 * @param rect 块的纵向范围
	 * @param index 命中的行号
	 * @param x 指针横坐标
	 * @param y 指针纵坐标
	 * @returns 落点
	 */
	const hitTree = (block: any, tree: TreeSession, el: HTMLElement, rect: Range, index: number, x: number, y: number): Nullable<Hit> => {
		if (index >= tree.start && index <= tree.end) return null;

		const { row, level } = getRowAt(index)!;
		const ratio = (y - rect.top) / Math.max(1, rect.bottom - rect.top);
		const middle = ratio >= 0.25 && ratio <= 0.75;
		// 收起的可展开节点（含未加载的懒加载节点）：指针停在中间区域时可自动展开
		const node = store.tree.getTreeNode(row, level);
		const expandRow = middle && node.expandable && !node.expanded ? row : null;
		const inner = store.drag.canInner(row);
		if (inner && middle) {
			return {
				targetRows: [row],
				position: 'inner',
				move: store.drag.getTreeMove(block, row, store.tree.getSiblings(row).length),
				rect,
				lineY: rect.bottom,
				lineLeft: null,
				expandRow
			};
		}

		const above = ratio < (inner ? 0.25 : 0.5);
		const skip = (i: number, step: number) => {
			if (i < tree.start || i > tree.end) return i;
			return step < 0 ? tree.start - 1 : tree.end + 1;
		};
		const upper = above ? getRowAt(skip(index - 1, -1)) : { row, level };
		const lower = above ? { row, level } : getRowAt(skip(index + 1, 1));
		const low = lower ? lower.level : 0;
		const high = Math.max(low, upper ? upper.level : low);
		const contentLeft = getTreeContentLeft(tree, el);
		const indent = props.indent;
		// 没有树形列，或各层级不缩进（横向位置无从区分）时取下方行的层级
		const chosen = contentLeft == null || indent <= 0 ? low : clamp(Math.floor((x - contentLeft) / indent), low, high);

		// 放在下方行之前，或上方行在 chosen 层级的祖先（chosen 等于上方行层级时即上方行）之后
		const before = !!lower && chosen === lower.level;
		let anchor = before ? lower!.row : upper!.row;
		if (!before) {
			for (let i = upper!.level; i > chosen; i--) anchor = store.tree.getParent(anchor);
		}
		const parent = store.tree.getParent(anchor);
		return {
			targetRows: [anchor],
			position: before ? 'before' : 'after',
			move: store.drag.getTreeMove(block, parent, store.drag.indexOf(parent, anchor) + (before ? 0 : 1)),
			rect,
			lineY: above ? rect.top : rect.bottom,
			lineLeft: contentLeft == null ? null : contentLeft + chosen * indent,
			expandRow
		};
	};

	/**
	 * 命中落点：在已渲染的块中二分查找指针所在的块；非树形表格以块的中线区分之前 / 之后
	 * @param current 拖拽状态
	 * @param session 拖拽会话
	 * @param x 指针横坐标
	 * @param y 指针纵坐标（已限制在可见范围内）
	 * @returns 落点
	 */
	const hitTest = (current: DragState, session: DragSession, x: number, y: number): Nullable<Hit> => {
		const els = session.blockEls || queryBlockEls();
		virtual.value || (session.blockEls = els);
		if (!els.length) return null;
		// 首个底边在指针之下的块；指针在所有块之下时取最后一块
		const el = els[Math.min(bisectFirst(els.length, i => getBlockRect(els[i]).bottom > y), els.length - 1)];
		const target = store.drag.getBlockByRowIndex(Number(el.dataset.rowStart));
		if (!target) return null;
		const rect = getBlockRect(el);
		if (session.tree) return hitTree(current.source, session.tree, el, rect, target.rowStart, x, y);

		const position: TableDropPosition = y < (rect.top + rect.bottom) / 2 ? 'before' : 'after';
		return {
			targetRows: store.drag.getRows(target),
			position,
			move: store.drag.getMove(current.source, target, position),
			rect,
			lineY: position === 'before' ? rect.top : rect.bottom,
			lineLeft: null,
			expandRow: null
		};
	};

	// ---------------------------------------------------------------------
	// 自动滚动
	// ---------------------------------------------------------------------
	/**
	 * 滚动表体自身（设置了 height / maxHeight 时）
	 * @param delta 纵向增量
	 * @returns 是否滚动了
	 */
	const scrollInner = (delta: number) => {
		const el = bodyXWrapper.value;
		const scroller = bodyScroller.value;
		return !!el && !!scroller && scrollBody(el, scroller, 'y', delta);
	};

	/**
	 * 滚动外部滚动承载者（窗口、元素或外层 VC Scroller）
	 * @param outer 外部滚动承载者
	 * @param delta 纵向增量
	 * @returns 是否滚动了
	 */
	const scrollOuter = (outer: ExternalCarrier, delta: number) => {
		const next = getNextOffset(outer.mainOffset, outer.scrollSize - outer.clientSize, delta);
		if (next == null) return false;
		outer.setMainOffset(next);
		return true;
	};

	/**
	 * 指针靠近可见范围上下边缘时滚动：表体自身可滚动时优先；
	 * 表体在该方向被外部滚动视口遮住时（流式高度、表格大于视口），滚动外部承载者
	 * @param current 拖拽状态
	 * @param session 拖拽会话
	 * @param visible 表体可见范围
	 * @returns 是否滚动了
	 */
	const autoScroll = (current: DragState, session: DragSession, visible: VisibleRect) => {
		const delta = getEdgeDelta(current.clientY, visible.top, visible.bottom);
		if (!delta) return false;
		if (scrollInner(delta)) return true;
		const clipped = delta < 0 ? visible.clippedTop : visible.clippedBottom;
		return clipped && scrollOuter(session.outer, delta);
	};

	// ---------------------------------------------------------------------
	// 插入线与跟随行
	// ---------------------------------------------------------------------
	/**
	 * 跟随行：克隆块的 grid，放进与表体等宽、横向滚动位置一致的容器，固定列（sticky）位置与表体一致
	 * @param root 表格根节点
	 * @param blockEl 块根节点
	 * @param offset 根节点偏移
	 * @returns 跟随行容器
	 */
	const createBlockGhost = (root: HTMLElement, blockEl: HTMLElement, offset: RootOffset) => {
		const body = bodyXWrapper.value!;
		// 表体内的单元格样式（固定列底色、斑马纹等）限定在 .vc-table__tbody 下
		const { ghost, clone, content } = createGhost(root, blockEl, 'vc-table__tbody');
		clone.removeAttribute('data-row-start');
		clone.classList.remove('is-dragging');
		clone.querySelectorAll('.hover-row, .hover-related').forEach((node) => {
			node.classList.remove('hover-row', 'hover-related');
		});
		content.style.width = `${blockEl.offsetWidth}px`;
		ghost.style.left = `${body.getBoundingClientRect().left - offset.left}px`;
		ghost.style.width = `${body.clientWidth}px`;
		ghost.scrollLeft = body.scrollLeft;
		return ghost;
	};

	/**
	 * 跟随行随指针纵向移动，限制在表体可见范围内（不盖住表头、吸顶表头与吸底 dock）；横向滚动位置与表体一致
	 * @param current 拖拽状态
	 * @param session 拖拽会话
	 * @param visible 表体可见范围
	 * @param offset 根节点偏移
	 * @param scrollLeft 表体横向滚动位置
	 */
	const updateGhost = (current: DragState, session: DragSession, visible: VisibleRect, offset: RootOffset, scrollLeft: number) => {
		const { ghost } = session;
		// 跟随行高于可见范围时顶部对齐
		const top = Math.max(Math.min(current.clientY - session.grabOffset, visible.bottom - session.ghostHeight), visible.top);
		ghost.style.top = `${top - offset.top}px`;
		ghost.scrollLeft !== scrollLeft && (ghost.scrollLeft = scrollLeft);
	};

	/**
	 * 插入线：落点之前 / 之后为一条线，树形表格的左端缩进到目标层级；
	 * inner 时改为框住目标行，跟随行淡出（与目标行重合，叠在一起两者都看不清）
	 * @param session 拖拽会话
	 * @param visible 表体可见范围
	 * @param offset 根节点偏移
	 */
	const updateIndicator = (session: DragSession, visible: VisibleRect, offset: RootOffset) => {
		const { indicator: el, ghost, drop } = session;
		const inner = drop?.position === 'inner';
		el.classList.toggle('is-inner', inner);
		ghost.classList.toggle('is-over-inner', inner);
		// 顺序不变的落点不显示
		if (!drop) {
			el.style.display = 'none';
			return;
		}
		const right = visible.left + visible.width;
		const top = clamp(inner ? drop.rect.top : drop.lineY, visible.top, visible.bottom);
		const left = inner ? visible.left : clamp(drop.lineLeft ?? visible.left, visible.left, right);
		el.style.display = '';
		el.style.top = `${top - offset.top}px`;
		el.style.left = `${left - offset.left}px`;
		el.style.width = `${right - left}px`;
		el.style.height = inner ? `${clamp(drop.rect.bottom, visible.top, visible.bottom) - top}px` : '';
		el.classList.toggle('is-disabled', !drop.allowed);
	};

	// ---------------------------------------------------------------------
	// 拖动
	// ---------------------------------------------------------------------
	/**
	 * 按命中结果更新落点；落点与上一帧相同时沿用 allowDrop 的结果（不重复调用）。
	 * 被拖块在会话中不变，块列表重建时落点清空，所以位置与落点行相同即移动相同
	 * @param current 拖拽状态
	 * @param session 拖拽会话
	 * @param hit 命中结果
	 */
	const updateDrop = (current: DragState, session: DragSession, hit: Nullable<Hit>) => {
		const { drop } = session;
		const move = hit?.move;
		if (!hit || !move) {
			session.drop = null;
			return;
		}
		const same = !!drop
			&& drop.position === hit.position
			&& toRaw(drop.targetRows[0]) === toRaw(hit.targetRows[0]);
		session.drop = {
			...hit,
			move,
			allowed: same ? drop!.allowed : store.drag.canDrop(current.source, hit.targetRows, hit.position, move)
		};
	};

	/**
	 * 悬停自动展开：指针停在收起节点的中间区域超过 HOVER_EXPAND 后展开（未加载的懒加载节点先加载）；
	 * 换到别的行或离开中间区域时重新计时
	 * @param session 拖拽会话
	 * @param hit 命中结果
	 */
	const updateHover = (session: DragSession, hit: Nullable<Hit>) => {
		const row = hit?.expandRow || null;
		const { hover } = session;
		if (toRaw(row) === toRaw(hover.row)) return;
		hover.timer && clearTimeout(hover.timer);
		hover.row = row;
		// 结束拖拽时清除计时，到时即仍在拖拽中
		hover.timer = row && setTimeout(() => {
			hover.timer = null;
			store.tree.toggle(row, true);
		}, HOVER_EXPAND);
	};

	/**
	 * 每帧：自动滚动，再按指针位置更新落点、跟随行与插入线（先读后写）
	 * @param current 拖拽状态
	 * @param session 拖拽会话
	 * @returns 仍在滚动时为 true（继续下一帧）
	 */
	const update = (current: DragState, session: DragSession) => {
		const root = tableWrapper.value;
		const body = bodyXWrapper.value;
		if (!root || !body) return false;
		let visible = getVisibleRect(session.outer)!;
		const scrolled = autoScroll(current, session, visible);
		// 滚动外部承载者后表体位置变化，重新测量
		scrolled && (visible = getVisibleRect(session.outer)!);

		const hit = hitTest(current, session, current.clientX, clamp(current.clientY, visible.top, visible.bottom));
		updateDrop(current, session, hit);
		updateHover(session, hit);
		const offset = toRootOffset(root);
		updateGhost(current, session, visible, offset, body.scrollLeft);
		updateIndicator(session, visible, offset);
		return scrolled;
	};

	/**
	 * 更新变暗的块：被拖块，树形表格还包括可见的子孙（紧随其后、层级更深的行，每行一块），并据此更新子树范围。
	 * 标记写在块上，只有标记变化的块重渲染：仍在其中的块不重复切换
	 * @param current 拖拽状态
	 * @param session 拖拽会话
	 */
	const updateDimmed = (current: DragState, session: DragSession) => {
		const block = current.source;
		const blocks = [block];
		const { tree } = session;
		if (tree) {
			const level = block.rows[0].level || 0;
			let next;
			while ((next = store.drag.getBlockByRowIndex(block.rowStart + blocks.length)) && (next.rows[0].level || 0) > level) {
				blocks.push(next);
			}
			tree.start = block.rowStart;
			tree.end = block.rowStart + blocks.length - 1;
		}
		const kept = new Set(blocks.map(item => toRaw(item)));
		session.dimmed.forEach(item => kept.has(toRaw(item)) || (item.dragging = false));
		blocks.forEach(item => (item.dragging = true));
		session.dimmed = blocks;
	};

	const activate = (current: DragState) => {
		const root = tableWrapper.value;
		const body = bodyXWrapper.value;
		const els = queryBlockEls();
		const blockEl = els.find(el => Number(el.dataset.rowStart) === current.source.rowStart);
		if (!root || !body || !blockEl) return null;

		const outer = resolveOuter(root);
		const visible = getVisibleRect(outer)!;
		const offset = toRootOffset(root);
		const ghost = createBlockGhost(root, blockEl, offset);
		const session: DragSession = {
			grabOffset: current.startY - blockEl.getBoundingClientRect().top,
			ghost,
			ghostHeight: ghost.offsetHeight,
			indicator: createIndicator(root),
			outer,
			blockEls: virtual.value ? null : els,
			dimmed: [],
			tree: store.tree.isTree ? { start: current.source.rowStart, end: current.source.rowStart, padding: null } : null,
			drop: null,
			hover: { row: null, timer: null }
		};
		// 立即定位，避免跟随行在下一帧之前出现在默认位置
		updateGhost(current, session, visible, offset, body.scrollLeft);

		updateDimmed(current, session);
		store.states.dragging = true;
		store.row.setHoverIndex(null);
		return session;
	};

	const start = (current: DragState) => {
		emit('block-dragstart', store.drag.getPayload(current.source) satisfies TableBlockDragPayload);
	};

	/**
	 * 结束拖拽（激活过的）：移除跟随行与插入线，恢复变暗的块；commit 且允许放置时写回并发出事件
	 * @param current 拖拽状态
	 * @param session 拖拽会话
	 * @param commit 是否按当前落点提交（Esc、失焦、数据变化等取消时为 false）
	 */
	const finish = (current: DragState, session: DragSession, commit: boolean) => {
		const block = current.source;
		const payload = store.drag.getPayload(block);
		session.ghost.remove();
		session.indicator.remove();
		session.hover.timer && clearTimeout(session.hover.timer);
		session.dimmed.forEach(item => (item.dragging = false));
		store.states.dragging = false;

		const { drop } = session;
		let dropped = false;
		if (commit && drop?.allowed) {
			const { move } = drop;
			// hover 按行号记录，重排后会指向别的行
			store.row.setHoverIndex(null);
			const rawData = store.drag.apply(block, move);
			emit('update:data', rawData);
			emit('block-drop', {
				rows: payload.rows,
				targetRows: drop.targetRows,
				position: drop.position,
				...move,
				rawData
			} satisfies TableBlockDropPayload);
			dropped = true;
		}
		emit('block-dragend', { ...payload, dropped } satisfies TableBlockDragEndPayload);
	};

	/**
	 * 按下位置对应的块：整行拖拽从单元格任意位置（交互元素除外），锚点拖拽从把手
	 * @param target 按下的元素
	 * @returns 块与是否从把手发起；不能发起时为 null
	 */
	const resolveSource = (target: Nullable<HTMLElement>) => {
		const root = tableWrapper.value;
		if (!root || !target?.closest) return null;

		const cell = target.closest<HTMLElement>('.vc-table__td[data-column]');
		// 只处理本表格表体的单元格：排除嵌套表格、展开内容、表头与合计行
		if (!cell || cell.closest('.vc-table') !== root) return null;

		const handle = target.closest('.vc-table__drag-handle');
		const byHandle = !!handle && cell.contains(handle);
		if (!byHandle) {
			if (!store.drag.draggable.value[0]) return null;
			const interactive = target.closest(INTERACTIVE_SELECTOR);
			if (interactive && cell.contains(interactive)) return null;
		}

		const block = store.drag.getBlockByRowIndex(Number(cell.dataset.row));
		if (!block || !store.drag.canDrag(block)) return null;
		return { source: block, byHandle };
	};

	const drag = usePointerDrag({ root: tableWrapper, resolve: resolveSource, activate, start, update, finish });

	/**
	 * 拖拽期间块列表重建（数据或列变化、树形表格展开 / 收起、懒加载完成）：
	 * 被拖动的块仍在其中（块按行复用）时继续拖拽，重新计算子树范围与变暗的块，下一帧重新查询块节点与落点；否则取消
	 */
	watch(() => store.states.list, (list) => {
		const current = drag.getState();
		if (!current) return;
		if (!toRaw(list).includes(toRaw(current.source))) {
			drag.cancel();
			return;
		}
		const { session } = current;
		if (!session) return;
		updateDimmed(current, session);
		session.blockEls = null;
		session.drop = null;
		drag.schedule();
	});

	return {
		handleMousedown: drag.handleMousedown,
		handleTouchstart: drag.handleTouchstart
	};
};
