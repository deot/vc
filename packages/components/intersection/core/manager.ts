export interface IntersectionOptions {
	// 参照的滚动容器；null 为浏览器视口
	root: Element | null;
	// 可视区四边的扩展量（CSS margin 写法，只支持 px / %）
	rootMargin: string;
	// 露出比例达到该值才算可见，[0, 1]
	threshold: number;
}

export interface IntersectionChange {
	visible: boolean;
	ratio: number;
	entry: IntersectionObserverEntry;
}

type Listener = (change: IntersectionChange) => void;

type Group = {
	io: IntersectionObserver;
	listeners: Map<Element, Listener>;
};

/**
 * 是否可见：threshold 为 0 时以是否相交为准（贴边也算）；否则露出比例要达到 threshold
 * 	- 浏览器在跨过阈值时才回调，ratio 可能因取整略小于阈值，留 0.001 的余量
 * @param entry ~
 * @param threshold ~
 * @returns ~
 */
const isVisible = (entry: IntersectionObserverEntry, threshold: number) => {
	if (!entry.isIntersecting) return false;
	return threshold <= 0 || entry.intersectionRatio >= threshold - 0.001;
};

/**
 * IntersectionObserver 的统一管理
 * 	- 同一 root + 同一 rootMargin / threshold 共用一个 IntersectionObserver，列表里成百上千个实例也只有一个
 * 	- 回调按 entry.target 分发给各自的监听函数；最后一个元素取消时断开并移除
 * 	- 分组跟着 root 走（WeakMap）：容器被回收时分组一并回收
 */
class Manager {
	// root 为 null（视口）时以 document 作键
	private groups = new WeakMap<object, Map<string, Group>>();

	/**
	 * 是否支持 IntersectionObserver
	 * @returns ~
	 */
	get supported() {
		return typeof IntersectionObserver === 'function';
	}

	/**
	 * 监听元素与 root 可视区的相交变化
	 * 	- 开始监听后浏览器会异步回调一次当前状态
	 * @param el 目标元素，须在 root 内
	 * @param options ~
	 * @param listener ~
	 * @returns 取消监听
	 */
	observe(el: Element, options: IntersectionOptions, listener: Listener) {
		if (!this.supported) return () => {};

		const { root, rootMargin, threshold } = options;
		const owner = root || document;
		const key = `${rootMargin}|${threshold}`;

		let groups = this.groups.get(owner);
		if (!groups) {
			groups = new Map();
			this.groups.set(owner, groups);
		}

		let group = groups.get(key);
		if (!group) {
			const listeners = new Map<Element, Listener>();
			const io = new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					listeners.get(entry.target)?.({
						visible: isVisible(entry, threshold),
						ratio: entry.intersectionRatio,
						entry
					});
				});
			}, {
				root,
				rootMargin,
				// 跨过阈值时（进出两个方向）回调
				threshold
			});
			group = { io, listeners };
			groups.set(key, group);
		}

		// 同一元素重复监听：以后一次为准，重新 observe 以拿到当前状态
		const current = group;
		current.listeners.set(el, listener);
		current.io.unobserve(el);
		current.io.observe(el);

		return () => {
			if (current.listeners.get(el) !== listener) return;
			current.listeners.delete(el);
			current.io.unobserve(el);
			if (current.listeners.size) return;
			current.io.disconnect();
			groups!.get(key) === current && groups!.delete(key);
		};
	}
}

export const IntersectionManager = new Manager();
