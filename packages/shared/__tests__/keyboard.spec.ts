// @vitest-environment jsdom

import { Keyboard } from '@deot/vc-shared';

describe('Keyboard', () => {
	const disposers: Array<() => void> = [];
	afterEach(() => {
		disposers.splice(0).forEach(dispose => dispose());
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});
	const keydown = (key: string, options: KeyboardEventInit = {}) => {
		const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options });
		document.dispatchEvent(event);
		return event;
	};

	it('倒序分发并消费按键，阻止背景监听', () => {
		const first = vi.fn();
		const last = vi.fn(() => true);
		const background = vi.fn();
		document.addEventListener('keydown', background);
		disposers.push(Keyboard.on(first), Keyboard.on(last));
		expect(keydown('Escape').defaultPrevented).toBe(true);
		expect(last).toHaveBeenCalledOnce();
		expect(first).not.toHaveBeenCalled();
		expect(background).not.toHaveBeenCalled();
		document.removeEventListener('keydown', background);
	});

	it('单键、大小写与组合键按修饰键精确匹配', () => {
		const plain = vi.fn();
		const combo = vi.fn();
		disposers.push(Keyboard.on('A', plain), Keyboard.on('ctrl+shift+a', combo));
		keydown('a');
		keydown('A', { ctrlKey: true, shiftKey: true });
		keydown('A', { ctrlKey: true, shiftKey: true, altKey: true });
		expect(plain).toHaveBeenCalledOnce();
		expect(combo).toHaveBeenCalledOnce();
	});

	it('按 event.key 匹配空格及带修饰键的空格', () => {
		const plain = vi.fn();
		const combo = vi.fn();
		disposers.push(Keyboard.on(' ', plain), Keyboard.on('ctrl+ ', combo));
		keydown(' ');
		keydown(' ', { ctrlKey: true });
		expect(plain).toHaveBeenCalledOnce();
		expect(combo).toHaveBeenCalledOnce();
		keydown('+');
		keydown('+', { ctrlKey: true });
		expect(plain).toHaveBeenCalledOnce();
		expect(combo).toHaveBeenCalledOnce();
	});

	it.each([
		['Control', { ctrlKey: true }], ['Shift', { shiftKey: true }],
		['Alt', { altKey: true }], ['Meta', { metaKey: true }]
	] as const)('修饰键 %s 本身也可作为单键订阅', (key, options) => {
		const handler = vi.fn();
		disposers.push(Keyboard.on(key, handler));
		keydown(key, options);
		keydown(key, { ...options, [key === 'Control' ? 'shiftKey' : 'ctrlKey']: true });
		expect(handler).toHaveBeenCalledOnce();
	});

	it('off 和重复取消安全，最后取消释放监听', () => {
		const remove = vi.spyOn(document, 'removeEventListener');
		const handler = vi.fn();
		const dispose = Keyboard.on('Escape', handler);
		Keyboard.off('Escape', handler);
		dispose();
		dispose();
		keydown('Escape');
		expect(handler).not.toHaveBeenCalled();
		expect(remove).toHaveBeenCalledWith('keydown', expect.any(Function), true);
	});

	it('加号可作为单键或组合键，off(handler) 移除该回调的全部注册', () => {
		const handler = vi.fn();
		disposers.push(Keyboard.on('+', handler), Keyboard.on('ctrl++', handler));
		keydown('+');
		keydown('+', { ctrlKey: true });
		expect(handler).toHaveBeenCalledTimes(2);
		Keyboard.off(handler);
		keydown('+');
		keydown('+', { ctrlKey: true });
		expect(handler).toHaveBeenCalledTimes(2);
	});

	it('取消尚未分发的监听，保留原生重复及组合输入信息', () => {
		const first = vi.fn();
		const cancelFirst = Keyboard.on(first);
		disposers.push(cancelFirst, Keyboard.on(() => {
			cancelFirst();
			Keyboard.focus(first);
		}));
		keydown('x', { repeat: true, isComposing: true });
		expect(first).not.toHaveBeenCalled();
		const handler = vi.fn();
		disposers.push(Keyboard.on(handler));
		keydown('x', { repeat: true, isComposing: true });
		expect(handler.mock.calls[0][0].repeat).toBe(true);
		expect(handler.mock.calls[0][0].isComposing).toBe(true);
		Keyboard.off(handler);
	});

	it('blur 暂停同一回调的全部订阅，focus 恢复并保持分发顺序', () => {
		const calls: string[] = [];
		const first = () => { calls.push('first'); };
		const handler = () => { calls.push('handler'); return true; };
		const last = () => { calls.push('last'); };
		disposers.push(Keyboard.on(first), Keyboard.on('a', handler), Keyboard.on('b', handler), Keyboard.on(last));
		Keyboard.blur(handler);
		Keyboard.blur(handler);
		expect(keydown('a').defaultPrevented).toBe(false);
		expect(keydown('b').defaultPrevented).toBe(false);
		expect(calls).toEqual(['last', 'first', 'last', 'first']);
		calls.length = 0;
		Keyboard.focus(handler);
		Keyboard.focus(handler);
		expect(keydown('a').defaultPrevented).toBe(true);
		expect(keydown('b').defaultPrevented).toBe(true);
		expect(calls).toEqual(['last', 'handler', 'last', 'handler']);
	});

	it('暂停后取消释放监听，focus 不会恢复已取消或未注册的回调', () => {
		const remove = vi.spyOn(document, 'removeEventListener');
		const handler = vi.fn(() => true);
		Keyboard.blur(handler);
		Keyboard.focus(handler);
		const dispose = Keyboard.on(handler);
		Keyboard.blur(handler);
		dispose();
		dispose();
		Keyboard.focus(handler);
		expect(keydown('a').defaultPrevented).toBe(false);
		expect(handler).not.toHaveBeenCalled();
		expect(remove).toHaveBeenCalledWith('keydown', expect.any(Function), true);
	});

	it('分发期间暂停尚未执行的回调立即生效', () => {
		const handler = vi.fn();
		disposers.push(Keyboard.on(handler), Keyboard.on(() => Keyboard.blur(handler)));
		keydown('a');
		expect(handler).not.toHaveBeenCalled();
	});

	it('无 DOM 环境可以导入', async () => {
		vi.stubGlobal('document', undefined);
		vi.resetModules();
		const module = await import('../src/keyboard');
		expect(module.Keyboard.on).toBeTypeOf('function');
	});
});
