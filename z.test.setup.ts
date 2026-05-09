// jsdom / Node 部分环境下 localStorage 不完整，避免 Icon 等依赖报错
const __lsStore: Record<string, string> = {};
const __localStoragePolyfill = {
	getItem: (key: string) => (__lsStore[key] ?? null),
	setItem: (key: string, value: string) => {
		__lsStore[key] = String(value);
	},
	removeItem: (key: string) => {
		delete __lsStore[key];
	},
	clear: () => {
		for (const k of Object.keys(__lsStore)) delete __lsStore[k];
	},
	key: (i: number) => Object.keys(__lsStore)[i] ?? null,
	get length() {
		return Object.keys(__lsStore).length;
	},
};
try {
	Object.defineProperty(globalThis, 'localStorage', {
		value: __localStoragePolyfill,
		writable: true,
		configurable: true,
	});
} catch {
	/* 已存在且不可覆盖时忽略 */
}
if (typeof window !== 'undefined' && window !== globalThis) {
	try {
		Object.defineProperty(window, 'localStorage', {
			value: __localStoragePolyfill,
			writable: true,
			configurable: true,
		});
	} catch {
		/* 同上 */
	}
}

// jsdom 缺失 ResizeObserver，统一在此处补齐
class MockResizeObserver {
	cb: any;
	targets: Set<Element> = new Set();
	constructor(cb: any) { this.cb = cb; }
	observe(el: Element) { this.targets.add(el); }
	unobserve(el: Element) { this.targets.delete(el); }
	disconnect() { this.targets.clear(); }
	trigger(target: Element) { this.cb([{ target }]); }
}

(globalThis as any).ResizeObserver = MockResizeObserver;

/**
 * jsdom + Vue 异步组件 unmount 后，部分 use-scroller / RecycleList 的 await nextTick
 * 微任务才落地，会触发 `wrapper.value.scrollHeight` 之类对 null 的访问。
 * 该 racing 与组件被卸载后状态有关，不影响测试正确性，统一忽略以避免 worker 异常退出导致覆盖率无法落盘。
 */
if (typeof process !== 'undefined' && process?.on) {
	process.on('unhandledRejection', () => {});
}
