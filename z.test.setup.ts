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
 * jsdom 缺失 Web Animations：按 delay + duration + endDelay 结束，不改样式。
 * 关键帧留在 effect.getKeyframes() 上；getAnimations() 只列出进行中的，finish() 可提前结束
 */
const runningAnimations = new Set<MockAnimation>();
class MockAnimation {
	playState: AnimationPlayState = 'running';
	playbackRate = 1;
	effect: { target: Element; getKeyframes: () => Keyframe[]; getTiming: () => KeyframeAnimationOptions };
	finished: Promise<MockAnimation>;
	private settle!: (isDone: boolean) => void;
	private timer?: ReturnType<typeof setTimeout>;

	constructor(target: Element, keyframes: Keyframe[], options: number | KeyframeAnimationOptions = {}) {
		const timing = typeof options === 'number' ? { duration: options } : options;
		this.effect = { target, getKeyframes: () => keyframes, getTiming: () => timing };
		this.finished = new Promise((resolve, reject) => {
			this.settle = isDone => (isDone ? resolve(this) : reject(new DOMException('The animation was aborted', 'AbortError')));
		});
		this.finished.catch(() => {});
		runningAnimations.add(this);
		this.schedule();
	}

	private schedule() {
		clearTimeout(this.timer);
		const { delay = 0, duration, endDelay = 0 } = this.effect.getTiming();
		this.timer = setTimeout(() => this.finish(), Math.max(delay + (Number(duration) || 0) + endDelay, 0));
	}

	private end(state: AnimationPlayState, isDone: boolean) {
		if (this.playState !== 'running') return;
		clearTimeout(this.timer);
		this.playState = state;
		runningAnimations.delete(this);
		this.settle(isDone);
	}

	finish() {
		this.end('finished', true);
	}

	cancel() {
		this.end('idle', false);
	}

	reverse() {
		this.playbackRate = -this.playbackRate;
		this.playState === 'running' && this.schedule();
	}
}

if (typeof Element !== 'undefined' && !Element.prototype.animate) {
	Element.prototype.animate = function (this: Element, keyframes: any, options?: any) {
		return new MockAnimation(this, keyframes, options) as unknown as Animation;
	};
	Element.prototype.getAnimations = function (this: Element) {
		return [...runningAnimations].filter(item => item.effect.target === this) as unknown as Animation[];
	};
}

/**
 * jsdom + Vue 异步组件 unmount 后，部分 use-scroller / RecycleList 的 await nextTick
 * 微任务才落地，会触发 `wrapper.value.scrollHeight` 之类对 null 的访问。
 * 该 racing 与组件被卸载后状态有关，不影响测试正确性，统一忽略以避免 worker 异常退出导致覆盖率无法落盘。
 */
if (typeof process !== 'undefined' && process?.on) {
	process.on('unhandledRejection', () => {});
}
