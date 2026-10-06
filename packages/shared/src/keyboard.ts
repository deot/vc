export type KeyboardHandler = (event: KeyboardEvent) => boolean | void;

type Subscription = {
	key?: string;
	handler: KeyboardHandler;
	isActive: boolean;
};
const modifiers = ['ctrl', 'shift', 'alt', 'meta'] as const;

class KeyboardManager {
	private subscriptions: Subscription[] = [];

	private matches(key: string, event: KeyboardEvent) {
		const parts = key.toLowerCase().split('+').map(part => part === ' ' ? part : part.trim());
		const value = parts.pop() || '+';
		return value === event.key.toLowerCase()
			&& modifiers.every((modifier) => {
				const pressed = parts.includes(modifier) || value === (modifier === 'ctrl' ? 'control' : modifier);
				return event[`${modifier}Key`] === pressed;
			});
	}

	private dispatch = (event: KeyboardEvent) => {
		for (const subscription of [...this.subscriptions].reverse()) {
			if (!subscription.isActive) continue;
			if (subscription.key && !this.matches(subscription.key, event)) continue;
			if (subscription.handler(event) === true) {
				event.preventDefault();
				event.stopImmediatePropagation();
				break;
			}
		}
	};

	on(handler: KeyboardHandler): () => void;
	on(key: string, handler: KeyboardHandler): () => void;
	/**
	 * 注册键盘监听。
	 * @param keyOrHandler 按键组合或原生事件回调
	 * @param handler 按键组合对应的回调
	 * @returns 取消本次注册的函数
	 */
	on(keyOrHandler: string | KeyboardHandler, handler?: KeyboardHandler) {
		const subscription: Subscription = {
			key: typeof keyOrHandler === 'string' ? keyOrHandler : undefined,
			handler: typeof keyOrHandler === 'function' ? keyOrHandler : handler!,
			isActive: true
		};
		if (!this.subscriptions.length && typeof document !== 'undefined') {
			document.addEventListener('keydown', this.dispatch, true);
		}
		this.subscriptions.push(subscription);
		return () => this.remove(subscription);
	}

	/**
	 * 恢复回调的全部订阅，不改变 DOM 焦点和分发顺序。
	 * @param handler 已注册的回调
	 */
	focus(handler: KeyboardHandler) {
		for (const subscription of this.subscriptions) {
			if (subscription.handler === handler) subscription.isActive = true;
		}
	}

	/**
	 * 暂停回调的全部订阅，不移除注册或改变 DOM 焦点。
	 * @param handler 已注册的回调
	 */
	blur(handler: KeyboardHandler) {
		for (const subscription of this.subscriptions) {
			if (subscription.handler === handler) subscription.isActive = false;
		}
	}

	private remove(subscription: Subscription) {
		const index = this.subscriptions.indexOf(subscription);
		if (index === -1) return;
		subscription.isActive = false;
		this.subscriptions.splice(index, 1);
		if (!this.subscriptions.length && typeof document !== 'undefined') {
			document.removeEventListener('keydown', this.dispatch, true);
		}
	}

	off(handler: KeyboardHandler): void;
	off(key: string, handler: KeyboardHandler): void;
	/**
	 * 移除匹配的键盘监听。
	 * @param keyOrHandler 按键组合或原生事件回调
	 * @param handler 按键组合对应的回调
	 */
	off(keyOrHandler: string | KeyboardHandler, handler?: KeyboardHandler) {
		const key = typeof keyOrHandler === 'string' ? keyOrHandler : undefined;
		const callback = typeof keyOrHandler === 'function' ? keyOrHandler : handler;

		this.subscriptions.filter(item => (key === undefined || item.key === key) && item.handler === callback)
			.forEach(subscription => this.remove(subscription));
	}
}

export const Keyboard = new KeyboardManager();
