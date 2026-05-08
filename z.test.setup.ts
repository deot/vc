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
