import { onMounted, onBeforeUnmount } from 'vue';
import type { Nullable } from '@deot/helper-shared';

// 滚动停止多久后才算停下（ms）
export const SCROLL_IDLE = 150;

type Listener = (target: Nullable<EventTarget>) => void;

// 最近一次滚动：所有使用方共用一个捕获阶段的监听，有使用方时才注册
// 滚动的元素用 WeakRef 保存：否则已卸载的组件（滚动过的容器）会一直留在内存里
const lastScroll = { time: 0, target: null as Nullable<WeakRef<EventTarget>> };
const subscribers = new Set<Listener>();
// 使用方的数量。只查询（getScrollWait / whenScrollIdle）的使用方可能很多（每个 Text 一个），只计数、不占订阅
let users = 0;
const markScroll = (e: Event) => {
	lastScroll.time = Date.now();
	lastScroll.target?.deref() === e.target || (lastScroll.target = e.target && new WeakRef(e.target));
	subscribers.forEach(fn => fn(e.target));
};

/**
 * 开始记录页面上的滚动
 * @param fn 需要逐次收到滚动的使用方传入，参数为滚动的元素（或 document）
 * @returns 注销函数（重复调用无效）
 */
export const listenScroll = (fn?: Listener) => {
	users++ || document.addEventListener('scroll', markScroll, { capture: true, passive: true });
	fn && subscribers.add(fn);
	let isActive = true;
	return () => {
		if (!isActive) return;
		isActive = false;
		fn && subscribers.delete(fn);
		--users || document.removeEventListener('scroll', markScroll, { capture: true });
	};
};

/**
 * 组件内使用：挂载时开始记录，卸载时注销
 * @param fn 见 listenScroll
 */
export const useScrollListener = (fn?: Listener) => {
	let unlisten: (() => void) | undefined;
	onMounted(() => (unlisten = listenScroll(fn)));
	onBeforeUnmount(() => unlisten?.());
};

/**
 * 这次滚动是否带动了 el：滚动的是页面，或是包含 el 的容器
 * @param target 滚动的元素（或 document）
 * @param el 关心的节点
 * @returns 是否相关
 */
export const isScrollOf = (target: Nullable<EventTarget> | undefined, el: Element) => {
	return target === document || (target instanceof Node && target.contains(el));
};

/**
 * el 所在的滚动容器（或页面）刚滚动过时，还要等多久才算停下
 *
 * 内容在静止的鼠标下移动也会触发移入，滚动期间的移入不该当作用户的悬停
 * @param el 关心的节点
 * @returns 剩余等待时间（ms），不大于 0 表示没有在滚动
 */
export const getScrollWait = (el: Element) => {
	return isScrollOf(lastScroll.target?.deref(), el) ? SCROLL_IDLE - (Date.now() - lastScroll.time) : 0;
};

// 等滚动停下的那一次移入（同一时刻只有一个：鼠标只会在一个节点上）
let pending: ReturnType<typeof setTimeout> | undefined;

/**
 * 把移入当作悬停来处理：el 所在的滚动容器（或页面）刚滚动过时等它停下，届时鼠标仍在 el 上才执行；没有在滚动时立即执行
 *
 * 之后在别的节点上再次调用会取消还在等待的这一次
 * @param el 鼠标移入的节点
 * @param fn 悬停时要做的事（弹出提示等）
 */
export const whenScrollIdle = (el: Element, fn: () => void) => {
	clearTimeout(pending);
	const wait = getScrollWait(el);
	if (wait <= 0) {
		fn();
		return;
	}
	pending = setTimeout(() => el.matches(':hover') && whenScrollIdle(el, fn), wait);
};
