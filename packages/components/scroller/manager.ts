import { getScroller } from './utils';

// 滚动回调：原生 scroll 事件，或 Scroller 的滚动通知（{ target, currentTarget }）
type Listener = (e: any) => void;

// useScroller 暴露的实例中，外部用到的部分
export interface ScrollerInstance {
	// 写入滚动位置（同步自绘滚动条）
	scrollTo: (options: { x?: number; y?: number }) => void;
	on: (listener: Listener) => void;
	off: (listener: Listener) => void;
}

/**
 * Scroller 实例的统一管理
 * 	- 按根节点登记实例（useScroller 在根节点的 ref 赋值时登记、卸载时移除）：生产构建中 DOM 上没有组件实例，按 getScroller 找到根节点后据此取回实例
 * 	- 订阅滚动：滚轮驱动时滚动位置在 rAF 中写入，原生 scroll 下一帧才派发，订阅 Scroller 的滚动通知才能与滚动同一帧
 */
class Manager {
	private instances = new WeakMap<Element, ScrollerInstance>();

	add(el: Element, instance: ScrollerInstance) {
		this.instances.set(el, instance);
	}

	remove(el: Element) {
		this.instances.delete(el);
	}

	get(el: Element) {
		return this.instances.get(el);
	}

	/**
	 * 订阅单个滚动容器的滚动：是 Scroller 时用 on 订阅其滚动通知，否则监听原生 scroll
	 * @param target 滚动容器或 window
	 * @param listener 滚动回调
	 * @returns 取消订阅
	 */
	listen(target: Element | Window, listener: Listener) {
		const instance = target instanceof Element ? this.get(target) : undefined;
		if (instance) {
			instance.on(listener);
			return () => instance.off(listener);
		}
		target.addEventListener('scroll', listener);
		return () => target.removeEventListener('scroll', listener);
	}

	/**
	 * 订阅 node 所在的滚动容器（从 node 自身起逐层向上）的滚动，见 listen
	 * @param node 起始节点
	 * @param listener 滚动回调
	 * @param options ~
	 * @param options.window 是否一并监听页面滚动（window）
	 * @returns scrollers：滚动容器（由内到外，不含 window）；off：取消全部订阅
	 */
	subscribe(node: Node | null | undefined, listener: Listener, options: { window?: boolean } = {}) {
		const scrollers: HTMLElement[] = [];
		const offs: Array<() => void> = [];
		for (let el = getScroller(node); el instanceof HTMLElement; el = getScroller(el.parentNode)) {
			scrollers.push(el);
			offs.push(this.listen(el, listener));
		}
		options.window && offs.push(this.listen(window, listener));
		return {
			scrollers,
			off: () => offs.forEach(fn => fn())
		};
	}
}

export const ScrollerManager = new Manager();
