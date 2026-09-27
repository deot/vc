import { onBeforeUnmount } from 'vue';
import type { Ref } from 'vue';
import { clamp } from 'lodash-es';
import { raf, caf } from '@deot/helper-utils';
import type { Nullable } from '@deot/helper-shared';

// 行拖拽与列拖拽共用：阈值、长按、自动滚动的参数，交互元素排除、插入线与指针拖拽的生命周期

// 超过该距离（px）才开始拖拽：单纯的点击、勾选不受影响
const THRESHOLD = 4;

// 触摸（非把手发起）：长按（ms）后才开始拖拽，之前移动超过 TOUCH_SLOP（px）视为滚动
const LONG_PRESS = 300;
const TOUCH_SLOP = 8;

// 自动滚动：指针进入可见范围边缘 EDGE（px）内时滚动，越靠近边缘越快，每帧最多 SPEED（px）
const EDGE = 48;
const SPEED = 16;

// 从这些元素按下不发起拖拽（保留输入、选择、点击等原有交互）
export const INTERACTIVE_SELECTOR = [
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
const BODY_DRAGGING_CLASS = 'vc-table-dragging';

const preventDefault = (e: Event) => e.preventDefault();

/**
 * 滚动 delta 后的位置
 * @param offset 当前位置
 * @param max 最大位置
 * @param delta 增量
 * @returns 新位置；不可滚动或已到边界时为 null
 */
export const getNextOffset = (offset: number, max: number, delta: number) => {
	if (max <= 0) return null;
	const next = clamp(offset + delta, 0, max);
	return Math.abs(next - offset) < 0.5 ? null : next;
};

/**
 * 按增量滚动表体（设置了 height / maxHeight 时纵向，超出宽度时横向）：交给表体的 Scroller 以同步滚动条
 * @param el 表体滚动容器
 * @param scroller 表体的 Scroller 实例；没有时直接写滚动位置
 * @param axis 滚动方向
 * @param delta 增量
 * @returns 是否滚动了
 */
export const scrollBody = (el: HTMLElement, scroller: any, axis: 'x' | 'y', delta: number) => {
	const next = axis === 'x'
		? getNextOffset(el.scrollLeft, el.scrollWidth - el.clientWidth, delta)
		: getNextOffset(el.scrollTop, el.scrollHeight - el.clientHeight, delta);
	if (next == null) return false;
	if (scroller) {
		scroller.scrollTo({ [axis]: next });
	} else {
		el[axis === 'x' ? 'scrollLeft' : 'scrollTop'] = next;
	}
	return true;
};

/**
 * 指针靠近范围边缘时的滚动增量：越靠近边缘越快
 * @param pointer 指针坐标
 * @param start 范围起点
 * @param end 范围终点
 * @returns 增量；不在边缘区域时为 0
 */
export const getEdgeDelta = (pointer: number, start: number, end: number) => {
	const zone = Math.min(EDGE, (end - start) / 3);
	if (zone <= 0) return 0;
	let direction = 0;
	let ratio = 0;
	if (pointer < start + zone) {
		direction = -1;
		ratio = (start + zone - pointer) / zone;
	} else if (pointer > end - zone) {
		direction = 1;
		ratio = (pointer - end + zone) / zone;
	}
	return direction && direction * Math.max(1, Math.round(SPEED * Math.min(1, ratio)));
};

/**
 * 根节点（position: relative）坐标系下的偏移
 * @param root 表格根节点
 * @returns 偏移
 */
export const toRootOffset = (root: HTMLElement) => {
	const rect = root.getBoundingClientRect();
	return { top: rect.top + root.clientTop, left: rect.left + root.clientLeft };
};

export type RootOffset = ReturnType<typeof toRootOffset>;

/**
 * 插入线（初始隐藏），挂在表格根节点下
 * @param root 表格根节点
 * @param className 附加类名
 * @returns 插入线
 */
export const createIndicator = (root: HTMLElement, className = '') => {
	const el = document.createElement('div');
	el.className = `vc-table__drop-indicator${className ? ` ${className}` : ''}`;
	el.setAttribute('aria-hidden', 'true');
	el.style.display = 'none';
	root.appendChild(el);
	return el;
};

/**
 * 跟随元素（跟随行 / 跟随块）：克隆源元素放进内容容器，挂在表格根节点下；
 * 克隆里的元素不参与原有的分组与引用：带 name 的已选中 radio 插入文档会取消同组原 radio 的选中，重复的 id 会干扰 label[for] 等引用
 * @param root 表格根节点
 * @param source 源元素
 * @param contentClass 内容容器的类名（沿用表体 / 表头内的单元格样式）
 * @param modifier 附加类名
 * @returns 跟随元素与其中的克隆
 */
export const createGhost = (root: HTMLElement, source: HTMLElement, contentClass: string, modifier = '') => {
	const ghost = document.createElement('div');
	ghost.className = `vc-table__drag-ghost${modifier ? ` ${modifier}` : ''}`;
	ghost.setAttribute('aria-hidden', 'true');
	ghost.setAttribute('inert', '');

	const clone = source.cloneNode(true) as HTMLElement;
	clone.querySelectorAll('[name], [id]').forEach((node) => {
		node.removeAttribute('name');
		node.removeAttribute('id');
	});
	const content = document.createElement('div');
	content.className = contentClass;
	content.appendChild(clone);
	ghost.appendChild(content);
	root.appendChild(ghost);
	return { ghost, clone, content };
};

/**
 * 指针拖拽的状态
 */
export type PointerDragState<T, S> = {
	// 拖拽源（块 / 列）
	source: T;
	startX: number;
	startY: number;
	clientX: number;
	clientY: number;
	// 触摸发起
	touch: boolean;
	// 从把手发起：触摸时手势直接归拖拽所有
	byHandle: boolean;
	// 触摸长按的计时
	timer: any;
	// 激活（越过阈值或长按）后的拖拽会话；未激活时为 null
	session: Nullable<S>;
};

type PointerDragOptions<T, S> = {
	// 表格根节点：松手后吞掉落在其中的 click
	root: Ref<Nullable<HTMLElement>>;
	/**
	 * 按下位置对应的拖拽源
	 * @param target 按下的元素
	 * @param point 按下的位置
	 * @param point.clientX 横坐标
	 * @param point.clientY 纵坐标
	 * @returns 拖拽源与是否从把手发起；不能发起时为 null
	 */
	resolve: (target: HTMLElement, point: { clientX: number; clientY: number }) => Nullable<{ source: T; byHandle: boolean }>;
	/**
	 * 激活：创建插入线、跟随元素等（不发事件）
	 * @param state 拖拽状态
	 * @returns 拖拽会话；为 null 时放弃这次拖拽
	 */
	activate: (state: PointerDragState<T, S>) => Nullable<S>;
	/**
	 * 激活完成、状态都已就绪后调用：发出 *-dragstart。
	 * 放在最后，监听器里同步结束拖拽（如卸载表格）时走正常的结束流程
	 * @param state 拖拽状态
	 * @param session 拖拽会话
	 */
	start: (state: PointerDragState<T, S>, session: S) => void;
	/**
	 * 每帧更新（指针位置已记录在 state 上）
	 * @param state 拖拽状态
	 * @param session 拖拽会话
	 * @returns 仍需下一帧（如自动滚动中）时为 true
	 */
	update: (state: PointerDragState<T, S>, session: S) => boolean | void;
	/**
	 * 结束（仅激活过的拖拽）：移除视觉元素，commit 时按落点提交，发出 *-drop / *-dragend
	 * @param state 拖拽状态
	 * @param session 拖拽会话
	 * @param commit 是否按当前落点提交（Esc、失焦、数据变化等取消时为 false）
	 */
	finish: (state: PointerDragState<T, S>, session: S, commit: boolean) => void;
};

/**
 * 指针拖拽的生命周期（行拖拽与列拖拽共用）：
 * 	- 鼠标移动超过阈值后激活；触摸从把手发起同鼠标，其余需长按，长按前移动视为滚动；
 * 	- 激活后每帧最多更新一次；拖拽中页面或表体滚动时随之更新；
 * 	- 左键松开（或触摸结束）提交；Esc、失焦、touchcancel、卸载时取消；
 * 	- 松手后吞掉紧随其后、落在表格内的 click，避免触发 row-click / header-click 等。
 * 按下时不阻止默认行为（焦点照常切换），文本选择与原生拖拽在按下期间阻止
 * @param options 拖拽源解析与激活、更新、结束的处理
 * @returns 根节点上的按下处理，以及当前状态与取消、安排更新的方法
 */
export const usePointerDrag = <T, S>(options: PointerDragOptions<T, S>) => {
	let state: Nullable<PointerDragState<T, S>> = null;
	let frame: Nullable<number> = null;

	// 指针离按下点的距离（横纵取大）
	const getDistance = (current: PointerDragState<T, S>, x: number, y: number) => {
		return Math.max(Math.abs(x - current.startX), Math.abs(y - current.startY));
	};

	// 触摸手势归拖拽所有：拦截 touchmove / touchend，不再交给滚动
	const isOwned = (current: PointerDragState<T, S>) => !!current.session || current.byHandle;

	const update = () => {
		frame = null;
		state?.session && options.update(state, state.session) && schedule();
	};

	/**
	 * 下一帧更新（同一帧内只安排一次）
	 */
	function schedule() {
		frame == null && (frame = raf(update));
	}

	const cancelUpdate = () => {
		frame != null && caf(frame);
		frame = null;
	};

	const suppressClick = () => {
		const root = options.root.value;
		if (!root) return;
		const handler = (e: Event) => {
			e.stopPropagation();
			e.preventDefault();
		};
		root.addEventListener('click', handler, true);
		setTimeout(() => root.removeEventListener('click', handler, true), 0);
	};

	const activate = (current: PointerDragState<T, S>) => {
		const session = options.activate(current);
		if (!session) return false;
		current.session = session;
		document.body.classList.add(BODY_DRAGGING_CLASS);
		window.getSelection?.()?.removeAllRanges();
		schedule();
		options.start(current, session);
		return true;
	};

	/**
	 * 结束拖拽
	 * @param commit 是否按当前落点提交
	 */
	function finish(commit: boolean) {
		const current = state;
		if (!current) return;
		state = null;
		current.timer && clearTimeout(current.timer);
		toggleListeners(false);
		cancelUpdate();
		if (!current.session) return;
		document.body.classList.remove(BODY_DRAGGING_CLASS);
		suppressClick();
		options.finish(current, current.session, commit);
	}

	/**
	 * 指针移动：未激活时超过阈值则激活；激活后记录位置，下一帧更新
	 * @param current 拖拽状态
	 * @param x 指针横坐标
	 * @param y 指针纵坐标
	 * @returns 是否处于拖拽中
	 */
	const moveTo = (current: PointerDragState<T, S>, x: number, y: number) => {
		current.clientX = x;
		current.clientY = y;
		if (!current.session) {
			if (getDistance(current, x, y) <= THRESHOLD) return false;
			if (!activate(current)) {
				finish(false);
				return false;
			}
		}
		schedule();
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
	 * 长按前移动超过 TOUCH_SLOP 视为滚动，放弃拖拽
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
		state?.session && schedule();
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
	function toggleListeners(add: boolean) {
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
	}

	const start = (source: T, x: number, y: number, touch: boolean, byHandle: boolean) => {
		state = { source, startX: x, startY: y, clientX: x, clientY: y, touch, byHandle, timer: null, session: null };
		toggleListeners(true);
		return state;
	};

	/**
	 * 鼠标按下
	 * @param e 根节点上的 mousedown
	 * @returns 是否发起了拖拽（未激活）
	 */
	const handleMousedown = (e: MouseEvent) => {
		if (e.button !== 0 || state) return false;
		const resolved = options.resolve(e.target as HTMLElement, e);
		if (!resolved) return false;
		start(resolved.source, e.clientX, e.clientY, false, resolved.byHandle);
		return true;
	};

	/**
	 * 触摸按下（passive）：从把手发起时手势直接归拖拽所有（把手 touch-action: none）；其余需长按
	 * @param e 根节点上的 touchstart
	 * @returns 是否发起了拖拽（未激活）
	 */
	const handleTouchstart = (e: TouchEvent) => {
		const touch = e.touches?.[0];
		if (state || !touch || e.touches.length !== 1) return false;
		const resolved = options.resolve(e.target as HTMLElement, touch);
		if (!resolved) return false;
		const current = start(resolved.source, touch.clientX, touch.clientY, true, resolved.byHandle);
		if (resolved.byHandle) return true;
		current.timer = setTimeout(() => {
			current.timer = null;
			state === current && !activate(current) && finish(false);
		}, LONG_PRESS);
		return true;
	};

	onBeforeUnmount(() => finish(false));

	return {
		handleMousedown,
		handleTouchstart,
		// 当前的拖拽状态（按下后、结束前）
		getState: () => state,
		schedule,
		cancel: () => finish(false)
	};
};
