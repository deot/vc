import { getScroller } from '@deot/helper-dom';
import type { AxisKeys } from './types';
import { isWindow, getScrollingElement } from './dom';

/**
 * 通过 provide('vc-scroller') 注入的 VC Scroller 最小结构；
 * 命中时滚动与订阅走它，以复用 Scroller 自身的滚动条同步
 */
export type InjectedScroller = {
	wrapper?: HTMLElement;
	scrollTo?: (options: { x?: number; y?: number }) => void;
	on?: (listener: (e: any) => void) => void;
	off?: (listener: (e: any) => void) => void;
};

/**
 * 外部滚动承载者：统一 Window / 滚动元素 / 注入的 VC Scroller 的主轴读写
 *
 * 只负责"承载者本身"的几何与事件，不知道列表的存在；
 * 列表相关的边界缓存见 ExternalViewport
 * 原 viewport.ts 的 ExternalViewport
 */
export class ExternalCarrier {
	target: Window | HTMLElement;
	scroller?: InjectedScroller;
	keys: AxisKeys;

	constructor(target: Window | HTMLElement, scroller: InjectedScroller | undefined, keys: AxisKeys) {
		this.target = target;
		this.scroller = scroller;
		this.keys = keys;
	}

	get isWindow() {
		return isWindow(this.target);
	}

	/**
	 * 主轴滚动位置
	 *
	 * Window 优先读滚动元素，为 0 时回退到 scrollY/scrollX（部分内核两者不同步）
	 * @returns 滚动位置
	 */
	get mainOffset() {
		const { axis, scrollAxis } = this.keys;
		if (!isWindow(this.target)) return this.target[scrollAxis] || 0;
		return getScrollingElement(this.target)[scrollAxis]
			|| (axis === 'y' ? this.target.scrollY : this.target.scrollX)
			|| 0;
	}

	get clientSize() {
		const { axis, clientSize } = this.keys;
		if (!isWindow(this.target)) return this.target[clientSize] || 0;
		return (axis === 'y' ? this.target.innerHeight : this.target.innerWidth)
			|| this.target.document.documentElement[clientSize]
			|| 0;
	}

	get scrollSize() {
		const { scrollSize } = this.keys;
		if (!isWindow(this.target)) return this.target[scrollSize] || 0;
		return getScrollingElement(this.target)[scrollSize] || 0;
	}

	/**
	 * 写主轴滚动位置；命中注入的 Scroller 时交给它，以同步其自绘滚动条
	 * @param value 目标位置
	 */
	setMainOffset(value: number) {
		const { axis, scrollAxis } = this.keys;
		if (this.scroller?.scrollTo) {
			this.scroller.scrollTo({ [axis]: value });
			return;
		}
		const el = isWindow(this.target) ? getScrollingElement(this.target) : this.target;
		el[scrollAxis] = value;
	}

	on(listener: (e: any) => void) {
		if (this.scroller?.on) {
			this.scroller.on(listener);
			return;
		}
		this.target.addEventListener('scroll', listener as EventListener);
	}

	off(listener: (e: any) => void) {
		if (this.scroller?.off) {
			this.scroller.off(listener);
			return;
		}
		this.target.removeEventListener('scroll', listener as EventListener);
	}

	/**
	 * 承载者内容区在客户区坐标中的起点：Window 为 0，元素为自身 rect 加边框
	 * @returns 起点
	 */
	private get contentOrigin() {
		if (isWindow(this.target)) return 0;
		const rect = this.target.getBoundingClientRect();
		return this.keys.axis === 'y'
			? rect.top + this.target.clientTop
			: rect.left + this.target.clientLeft;
	}

	/**
	 * 元素在承载者滚动坐标系中的起止（已含当前滚动偏移）
	 * 原 getElementStart / getElementEnd 的公共部分
	 * @param el 目标元素
	 * @returns 起止位置
	 */
	getElementBounds(el: HTMLElement) {
		const rect = el.getBoundingClientRect();
		const base = this.mainOffset - this.contentOrigin;
		return this.keys.axis === 'y'
			? { start: base + rect.top, end: base + rect.bottom }
			: { start: base + rect.left, end: base + rect.right };
	}

	getElementStart(el: HTMLElement) {
		return this.getElementBounds(el).start;
	}

	getElementEnd(el: HTMLElement) {
		return this.getElementBounds(el).end;
	}
}

/**
 * 从列表根元素向上寻找主轴滚动祖先（优先识别 VC Scroller 的 wrapper），找不到时用 Window
 *
 * 只有当命中的元素恰好是注入 Scroller 的 wrapper 时才复用注入实例，
 * 避免把内层 Scroller 的注入用到外层原生滚动容器上
 * 原 resolveExternalViewport
 * @param root 列表根元素
 * @param injected provide('vc-scroller') 注入的实例
 * @param keys 主轴键
 * @returns 承载者
 */
export const resolveExternalCarrier = (
	root: HTMLElement,
	injected: InjectedScroller | undefined,
	keys: AxisKeys
) => {
	const target = (getScroller(root.parentElement || root.ownerDocument.documentElement, {
		direction: keys.axis,
		className: /(?:vc-scroller-wheel|vc-scroller__wrapper)/
	}) || root.ownerDocument.defaultView) as Window | HTMLElement;
	const scroller = injected?.wrapper === target ? injected : undefined;
	return new ExternalCarrier(target, scroller, keys);
};
