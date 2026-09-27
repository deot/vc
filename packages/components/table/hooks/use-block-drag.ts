import { watch, inject, toRaw, onBeforeUnmount } from 'vue';
import type { Ref } from 'vue';
import { raf, caf } from '@deot/helper-utils';
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

type DragState = {
	// 被拖动的块（states.list 中的块）
	block: any;
	startX: number;
	startY: number;
	clientX: number;
	clientY: number;
	// 触摸发起
	touch: boolean;
	// 从把手发起：触摸时手势直接归拖拽所有
	byHandle: boolean;
	// 整行触摸的长按计时
	timer: any;
	// 未激活（未超过阈值、未长按）时为 null
	session: Nullable<DragSession>;
};

// 超过该距离（px）才开始拖拽：单纯的点击、勾选不受影响
const THRESHOLD = 4;

// 整行触摸：长按（ms）后才开始拖拽，之前移动超过 TOUCH_SLOP（px）视为滚动
const LONG_PRESS = 300;
const TOUCH_SLOP = 8;

// 树形表格：指针在收起节点的中间区域停留（ms）后自动展开
const HOVER_EXPAND = 600;

// 自动滚动：指针进入可见范围上下边缘 EDGE（px）内时滚动，越靠近边缘越快，每帧最多 SPEED（px）
const EDGE = 48;
const SPEED = 16;

// 外部滚动承载者的纵向属性名
const Y_KEYS: AxisKeys = {
	axis: 'y',
	scrollAxis: 'scrollTop',
	clientSize: 'clientHeight',
	scrollSize: 'scrollHeight',
	offsetSize: 'offsetHeight'
};

// 整行拖拽时，从这些元素按下不发起拖拽（保留输入、选择、点击等原有交互）
const INTERACTIVE_SELECTOR = [
	'input',
	'textarea',
	'select',
	'button',
	'a[href]',
	'[contenteditable]:not([contenteditable="false"])',
	'label',
	'.vc-checkbox',
	'.vc-table__expand-icon'
].join(',');

// 拖拽中挂在 body 上：全局 move 光标、禁止选中文本
const BODY_DRAGGING_CLASS = 'vc-table-block-dragging';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

// 指针离按下点的距离（横纵取大）
const getDistance = (current: DragState, x: number, y: number) => {
	return Math.max(Math.abs(x - current.startX), Math.abs(y - current.startY));
};

// 触摸手势归拖拽所有：拦截 touchmove / touchend，不再交给滚动
const isOwned = (current: DragState) => !!current.session || current.byHandle;

const preventDefault = (e: Event) => e.preventDefault();

/**
 * 纵向滚动 delta 后的位置
 * @param offset 当前位置
 * @param max 最大位置
 * @param delta 纵向增量
 * @returns 新位置；不可滚动或已到边界时为 null
 */
const getNextOffset = (offset: number, max: number, delta: number) => {
	if (max <= 0) return null;
	const next = clamp(offset + delta, 0, max);
	return Math.abs(next - offset) < 0.5 ? null : next;
};

/**
 * 拖拽排序（以块为单位）：
 * 	- 整行拖拽（draggable）从单元格任意位置按下，锚点拖拽从 `.vc-table__drag-handle`（type="drag" 列）按下；
 * 	- 鼠标移动超过阈值后激活；触摸从把手发起同鼠标，整行触摸需长按；
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

	let state: Nullable<DragState> = null;
	let frame: Nullable<number> = null;

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
		if (session.tree) return hitTree(current.block, session.tree, el, rect, target.rowStart, x, y);

		const position: TableDropPosition = y < (rect.top + rect.bottom) / 2 ? 'before' : 'after';
		return {
			targetRows: store.drag.getRows(target),
			position,
			move: store.drag.getMove(current.block, target, position),
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
		const next = el && scroller ? getNextOffset(el.scrollTop, el.scrollHeight - el.clientHeight, delta) : null;
		if (next == null) return false;
		scroller.scrollTo({ y: next });
		return true;
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
		const zone = Math.min(EDGE, (visible.bottom - visible.top) / 3);
		if (zone <= 0) return false;

		const y = current.clientY;
		let direction = 0;
		let ratio = 0;
		if (y < visible.top + zone) {
			direction = -1;
			ratio = (visible.top + zone - y) / zone;
		} else if (y > visible.bottom - zone) {
			direction = 1;
			ratio = (y - visible.bottom + zone) / zone;
		}
		if (!direction) return false;

		const delta = direction * Math.max(1, Math.round(SPEED * Math.min(1, ratio)));
		if (scrollInner(delta)) return true;
		const clipped = direction < 0 ? visible.clippedTop : visible.clippedBottom;
		return clipped && scrollOuter(session.outer, delta);
	};

	// ---------------------------------------------------------------------
	// 插入线与跟随行
	// ---------------------------------------------------------------------
	// 根节点（position: relative）坐标系下的偏移
	const toRootOffset = (root: HTMLElement) => {
		const rect = root.getBoundingClientRect();
		return { top: rect.top + root.clientTop, left: rect.left + root.clientLeft };
	};

	type Offset = ReturnType<typeof toRootOffset>;

	const createIndicator = (root: HTMLElement) => {
		const el = document.createElement('div');
		el.className = 'vc-table__drop-indicator';
		el.setAttribute('aria-hidden', 'true');
		el.style.display = 'none';
		root.appendChild(el);
		return el;
	};

	/**
	 * 跟随行：克隆块的 grid，放进与表体等宽、横向滚动位置一致的容器，固定列（sticky）位置与表体一致
	 * @param root 表格根节点
	 * @param blockEl 块根节点
	 * @param offset 根节点偏移
	 * @returns 跟随行容器
	 */
	const createGhost = (root: HTMLElement, blockEl: HTMLElement, offset: Offset) => {
		const body = bodyXWrapper.value!;
		const ghost = document.createElement('div');
		ghost.className = 'vc-table__drag-ghost';
		ghost.setAttribute('aria-hidden', 'true');
		ghost.setAttribute('inert', '');

		const clone = blockEl.cloneNode(true) as HTMLElement;
		clone.removeAttribute('data-row-start');
		clone.classList.remove('is-dragging');
		clone.querySelectorAll('.hover-row, .hover-related').forEach((node) => {
			node.classList.remove('hover-row', 'hover-related');
		});
		// 克隆里的元素不参与原有的分组与引用：带 name 的已选中 radio 插入文档会取消同组原 radio 的选中；重复的 id 会干扰 label[for] 等引用
		clone.querySelectorAll('[name], [id]').forEach((node) => {
			node.removeAttribute('name');
			node.removeAttribute('id');
		});
		// 表体内的单元格样式（固定列底色、斑马纹等）限定在 .vc-table__tbody 下
		const content = document.createElement('div');
		content.className = 'vc-table__tbody';
		content.style.width = `${blockEl.offsetWidth}px`;
		content.appendChild(clone);
		ghost.appendChild(content);

		ghost.style.left = `${body.getBoundingClientRect().left - offset.left}px`;
		ghost.style.width = `${body.clientWidth}px`;
		root.appendChild(ghost);
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
	const updateGhost = (current: DragState, session: DragSession, visible: VisibleRect, offset: Offset, scrollLeft: number) => {
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
	const updateIndicator = (session: DragSession, visible: VisibleRect, offset: Offset) => {
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
			allowed: same ? drop!.allowed : store.drag.canDrop(current.block, hit.targetRows, hit.position, move)
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
		hover.timer = row && setTimeout(() => {
			hover.timer = null;
			state?.session === session && store.tree.toggle(row, true);
		}, HOVER_EXPAND);
	};

	/**
	 * 每帧：自动滚动，再按指针位置更新落点、跟随行与插入线（先读后写）；仍在滚动时继续下一帧
	 */
	const update = () => {
		frame = null;
		const current = state;
		const session = current?.session;
		const root = tableWrapper.value;
		const body = bodyXWrapper.value;
		if (!current || !session || !root || !body) return;
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
		scrolled && scheduleUpdate();
	};

	/**
	 * 下一帧更新（同一帧内只安排一次）
	 */
	function scheduleUpdate() {
		frame == null && (frame = raf(update));
	}

	const cancelUpdate = () => {
		frame != null && caf(frame);
		frame = null;
	};

	/**
	 * 更新变暗的块：被拖块，树形表格还包括可见的子孙（紧随其后、层级更深的行，每行一块），并据此更新子树范围。
	 * 标记写在块上，只有标记变化的块重渲染：仍在其中的块不重复切换
	 * @param current 拖拽状态
	 * @param session 拖拽会话
	 */
	const updateDimmed = (current: DragState, session: DragSession) => {
		const { block } = current;
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
		const blockEl = els.find(el => Number(el.dataset.rowStart) === current.block.rowStart);
		if (!root || !body || !blockEl) return false;

		const outer = resolveOuter(root);
		const visible = getVisibleRect(outer)!;
		const offset = toRootOffset(root);
		const ghost = createGhost(root, blockEl, offset);
		const session: DragSession = {
			grabOffset: current.startY - blockEl.getBoundingClientRect().top,
			ghost,
			ghostHeight: ghost.offsetHeight,
			indicator: createIndicator(root),
			outer,
			blockEls: virtual.value ? null : els,
			dimmed: [],
			tree: store.tree.isTree ? { start: current.block.rowStart, end: current.block.rowStart, padding: null } : null,
			drop: null,
			hover: { row: null, timer: null }
		};
		current.session = session;
		// 立即定位，避免跟随行在下一帧之前出现在默认位置
		updateGhost(current, session, visible, offset, body.scrollLeft);

		updateDimmed(current, session);
		store.states.dragBlock = current.block;
		store.row.setHoverIndex(null);
		document.body.classList.add(BODY_DRAGGING_CLASS);
		window.getSelection?.()?.removeAllRanges();

		emit('block-dragstart', store.drag.getPayload(current.block) satisfies TableBlockDragPayload);
		scheduleUpdate();
		return true;
	};

	// 松手后吞掉紧随其后、落在表格内的 click，避免触发 row-click / current-change；表格外的点击不受影响
	const suppressClick = () => {
		const root = tableWrapper.value;
		if (!root) return;
		const handler = (e: Event) => {
			e.stopPropagation();
			e.preventDefault();
		};
		root.addEventListener('click', handler, true);
		setTimeout(() => root.removeEventListener('click', handler, true), 0);
	};

	/**
	 * 指针移动：未激活时超过阈值则激活；激活后记录位置，下一帧更新
	 * @param current 拖拽状态
	 * @param x 指针横坐标
	 * @param y 指针纵坐标
	 * @returns 是否处于拖拽中
	 */
	const moveTo = (current: DragState, x: number, y: number) => {
		current.clientX = x;
		current.clientY = y;
		if (!current.session) {
			if (getDistance(current, x, y) <= THRESHOLD) return false;
			if (!activate(current)) {
				finish(false);
				return false;
			}
		}
		scheduleUpdate();
		return true;
	};

	const handleMousemove = (e: MouseEvent) => {
		const current = state;
		if (!current || current.touch) return;
		// 左键已松开却没有收到 mouseup（如在窗口外松开）：取消
		if (e.buttons === 0) {
			finish(false);
			return;
		}
		moveTo(current, e.clientX, e.clientY) && e.preventDefault();
	};

	// 只有左键松开才结束
	const handleMouseup = (e: MouseEvent) => {
		e.button === 0 && state && !state.touch && finish(true);
	};

	/**
	 * 触摸移动（window 捕获阶段、非 passive）：
	 * 手势归拖拽所有时阻止默认滚动，并截断传播，避免表体 Scroller 的模拟触摸滚动；
	 * 整行触摸在长按前移动超过 TOUCH_SLOP 视为滚动，放弃拖拽
	 * @param e touchmove
	 */
	const handleTouchmove = (e: TouchEvent) => {
		const current = state;
		const touch = e.touches?.[0];
		if (!current || !current.touch || !touch) return;
		if (!isOwned(current)) {
			getDistance(current, touch.clientX, touch.clientY) > TOUCH_SLOP && finish(false);
			return;
		}
		e.stopPropagation();
		e.cancelable && e.preventDefault();
		moveTo(current, touch.clientX, touch.clientY);
	};

	const handleTouchend = (e: TouchEvent) => {
		const current = state;
		if (!current || !current.touch) return;
		// 表体 Scroller 的触摸惯性由 touchend 触发
		isOwned(current) && e.stopPropagation();
		finish(true);
	};

	const handleTouchcancel = () => {
		state?.touch && finish(false);
	};

	// 长按期间的系统菜单（Android 长按触发 contextmenu）
	const handleContextmenu = (e: Event) => {
		state && isOwned(state) && e.preventDefault();
	};

	// 拖拽中表体、页面被滚动（滚轮、触控板、自动滚动）：落点与插入线随之更新
	const handleScroll = () => {
		state?.session && scheduleUpdate();
	};

	const handleKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Escape') {
			e.preventDefault();
			finish(false);
		}
	};

	const handleBlur = () => finish(false);

	/**
	 * 按下到结束期间的监听。
	 * 原生拖拽（图片、链接、选中的文本）与文本选择在这里阻止，而不是在按下时 preventDefault，以免影响焦点切换
	 * @param add 绑定或解绑
	 */
	const toggleListeners = (add: boolean) => {
		const fn = (add ? window.addEventListener : window.removeEventListener).bind(window);
		fn('mousemove', handleMousemove);
		fn('mouseup', handleMouseup);
		fn('touchmove', handleTouchmove as EventListener, { capture: true, passive: false } as any);
		fn('touchend', handleTouchend as EventListener, true);
		fn('touchcancel', handleTouchcancel, true);
		fn('contextmenu', handleContextmenu, true);
		fn('dragstart', preventDefault, true);
		fn('selectstart', preventDefault, true);
		fn('scroll', handleScroll, { capture: true, passive: true } as any);
		fn('keydown', handleKeydown as EventListener, true);
		fn('blur', handleBlur);
	};

	/**
	 * 结束拖拽
	 * @param commit 是否按当前落点提交（Esc、失焦、数据变化等取消时为 false）
	 */
	function finish(commit: boolean) {
		const current = state;
		if (!current) return;
		state = null;
		current.timer && clearTimeout(current.timer);
		toggleListeners(false);
		cancelUpdate();
		const { block, session } = current;
		if (!session) return;

		const payload = store.drag.getPayload(block);
		session.ghost.remove();
		session.indicator.remove();
		session.hover.timer && clearTimeout(session.hover.timer);
		session.dimmed.forEach(item => (item.dragging = false));
		store.states.dragBlock = null;
		document.body.classList.remove(BODY_DRAGGING_CLASS);
		suppressClick();

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
	}

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
			if (!props.draggable) return null;
			const interactive = target.closest(INTERACTIVE_SELECTOR);
			if (interactive && cell.contains(interactive)) return null;
		}

		const block = store.drag.getBlockByRowIndex(Number(cell.dataset.row));
		if (!block || !store.drag.canDrag(block)) return null;
		return { block, byHandle };
	};

	const start = (block: any, x: number, y: number, touch: boolean, byHandle: boolean): DragState => {
		state = {
			block,
			startX: x,
			startY: y,
			clientX: x,
			clientY: y,
			touch,
			byHandle,
			timer: null,
			session: null
		};
		toggleListeners(true);
		return state;
	};

	/**
	 * 鼠标按下：不阻止默认行为（焦点照常切换），文本选择与原生拖拽在按下期间由 toggleListeners 阻止
	 * @param e 根节点上的 mousedown
	 */
	const handleMousedown = (e: MouseEvent) => {
		if (e.button !== 0 || state) return;
		const source = resolveSource(e.target as Nullable<HTMLElement>);
		if (!source) return;
		start(source.block, e.clientX, e.clientY, false, source.byHandle);
	};

	/**
	 * 触摸按下（passive）：从把手发起时手势直接归拖拽所有（把手 touch-action: none）；整行需长按
	 * @param e 根节点上的 touchstart
	 */
	const handleTouchstart = (e: TouchEvent) => {
		const touch = e.touches?.[0];
		if (state || !touch || e.touches.length !== 1) return;
		const source = resolveSource(e.target as Nullable<HTMLElement>);
		if (!source) return;
		const current = start(source.block, touch.clientX, touch.clientY, true, source.byHandle);
		if (source.byHandle) return;
		current.timer = setTimeout(() => {
			current.timer = null;
			state === current && !activate(current) && finish(false);
		}, LONG_PRESS);
	};

	/**
	 * 拖拽期间块列表重建（数据或列变化、树形表格展开 / 收起、懒加载完成）：
	 * 被拖动的块仍在其中（块按行复用）时继续拖拽，重新计算子树范围与变暗的块，下一帧重新查询块节点与落点；否则取消
	 */
	watch(() => store.states.list, (list) => {
		const current = state;
		if (!current) return;
		const { session } = current;
		if (!toRaw(list).includes(toRaw(current.block))) {
			finish(false);
			return;
		}
		if (!session) return;
		updateDimmed(current, session);
		session.blockEls = null;
		session.drop = null;
		scheduleUpdate();
	});

	onBeforeUnmount(() => finish(false));

	return {
		handleMousedown,
		handleTouchstart
	};
};
