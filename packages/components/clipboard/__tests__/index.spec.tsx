// @vitest-environment jsdom

import { vi } from 'vitest';
import { Clipboard, MClipboard, Message, MToast } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { copyToClipboard, toggleSelection, group } from '../utils';

beforeEach(() => {
	// jsdom 未实现 execCommand, 默认 mock 成功
	document.execCommand = vi.fn(() => true);
});

afterEach(() => {
	vi.restoreAllMocks();
	// @ts-ignore
	delete (window as any).clipboardData;
});

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Clipboard).toBe('object');
		expect(typeof MClipboard).toBe('object');
	});

	it('create', async () => {
		const wrapper = mount(() => (<Clipboard />));

		expect(wrapper.classes()).toContain('vc-clipboard');
	});

	it('group: index 上挂载了工具方法', () => {
		expect(typeof Clipboard.set).toBe('function');
		expect(typeof Clipboard.get).toBe('function');
		expect(typeof Clipboard.clear).toBe('function');
		expect(typeof Clipboard.clearSelection).toBe('function');
	});
});

describe('clipboard.tsx', () => {
	it('tag: 使用自定义标签渲染', () => {
		const wrapper = mount(() => (<Clipboard tag="span" />));

		expect(wrapper.element.tagName).toBe('SPAN');
	});

	it('slot: 渲染默认插槽内容', () => {
		const wrapper = mount(() => (
			<Clipboard v-slots={{ default: () => '复制' }} />
		));

		expect(wrapper.text()).toBe('复制');
	});

	it('click: 复制成功时调用默认提示', async () => {
		const success = vi.spyOn(Message, 'success').mockImplementation(() => ({}) as any);
		const wrapper = mount(() => (<Clipboard value="hello" />));

		await wrapper.trigger('click');

		expect(document.execCommand).toHaveBeenCalledWith('copy');
		expect(success).toHaveBeenCalledWith({ content: '复制成功' });
	});

	it('before: 复制前修改内容', async () => {
		const onBefore = vi.fn((_e: any, value: string) => `${value}-modified`);
		const onAfter = vi.fn();
		const wrapper = mount(() => (
			<Clipboard value="hello" onBefore={onBefore} onAfter={onAfter} />
		));

		await wrapper.trigger('click');

		expect(onBefore).toHaveBeenCalledWith(expect.anything(), 'hello');
		expect(onAfter).toHaveBeenCalledWith('hello-modified');
	});

	it('after: 存在 onAfter 时不调用默认提示', async () => {
		const success = vi.spyOn(Message, 'success').mockImplementation(() => ({}) as any);
		const onAfter = vi.fn();
		const wrapper = mount(() => (
			<Clipboard value="hello" onAfter={onAfter} />
		));

		await wrapper.trigger('click');

		expect(onAfter).toHaveBeenCalledWith('hello');
		expect(success).not.toHaveBeenCalled();
	});

	it('error: onBefore 抛错时触发 error 事件', async () => {
		const onError = vi.fn();
		const error = new Error('boom');
		const onBefore = vi.fn(() => { throw error; });
		const wrapper = mount(() => (
			<Clipboard value="hello" onBefore={onBefore} onError={onError} />
		));

		await wrapper.trigger('click');

		expect(onError).toHaveBeenCalledWith(error);
	});

	it('click: 复制失败时不调用提示与 onAfter', async () => {
		(document.execCommand as any) = vi.fn(() => { throw new Error('fail'); });
		// @ts-ignore
		(window as any).clipboardData = {
			setData: () => { throw new Error('fail'); }
		};
		vi.spyOn(console, 'log').mockImplementation(() => {});
		const success = vi.spyOn(Message, 'success').mockImplementation(() => ({}) as any);
		const onAfter = vi.fn();
		const wrapper = mount(() => (<Clipboard value="hello" onAfter={onAfter} />));

		await wrapper.trigger('click');

		expect(success).not.toHaveBeenCalled();
		expect(onAfter).not.toHaveBeenCalled();
	});
});

describe('utils.ts', () => {
	it('copyToClipboard: 成功返回 true', () => {
		expect(copyToClipboard('hello')).toBe(true);
	});

	it('copyToClipboard: execCommand 失败时降级到 clipboardData', () => {
		(document.execCommand as any) = vi.fn(() => false);
		const setData = vi.fn();
		// @ts-ignore
		(window as any).clipboardData = { setData };

		expect(copyToClipboard('hello')).toBe(true);
		expect(setData).toHaveBeenCalledWith('text', 'hello');
	});

	it('copyToClipboard: 降级写入抛错时返回 undefined', () => {
		(document.execCommand as any) = vi.fn(() => { throw new Error('fail'); });
		// @ts-ignore
		(window as any).clipboardData = {
			setData: () => { throw new Error('fail'); }
		};
		const log = vi.spyOn(console, 'log').mockImplementation(() => {});

		expect(copyToClipboard('hello')).toBeUndefined();
		expect(log).toHaveBeenCalled();
	});

	it('toggleSelection: 无选区时返回空函数', () => {
		expect(typeof toggleSelection()).toBe('function');
	});

	it('toggleSelection: 存在选区时返回还原函数', () => {
		const el = document.createElement('div');
		el.textContent = 'hello';
		document.body.appendChild(el);

		const range = document.createRange();
		range.selectNodeContents(el);
		const selection = document.getSelection()!;
		selection.removeAllRanges();
		selection.addRange(range);

		const restore = toggleSelection();
		expect(typeof restore).toBe('function');
		restore?.();

		document.body.removeChild(el);
	});

	it('toggleSelection: 聚焦输入框时先失焦再还原', () => {
		const input = document.createElement('input');
		document.body.appendChild(input);
		input.focus();
		expect(document.activeElement).toBe(input);

		const range = document.createRange();
		range.selectNodeContents(input);
		const selection = document.getSelection()!;
		selection.removeAllRanges();
		selection.addRange(range);

		const restore = toggleSelection();
		expect(document.activeElement).not.toBe(input);

		restore?.();
		document.body.removeChild(input);
	});

	it('toggleSelection: 聚焦 textarea 时先失焦', () => {
		const textarea = document.createElement('textarea');
		document.body.appendChild(textarea);
		textarea.focus();

		const range = document.createRange();
		range.selectNodeContents(textarea);
		const selection = document.getSelection()!;
		selection.removeAllRanges();
		selection.addRange(range);

		const restore = toggleSelection();
		expect(document.activeElement).not.toBe(textarea);

		restore?.();
		document.body.removeChild(textarea);
	});

	it('toggleSelection: activeElement 为空时提前返回', () => {
		const el = document.createElement('div');
		el.textContent = 'hello';
		document.body.appendChild(el);

		const range = document.createRange();
		range.selectNodeContents(el);
		const selection = document.getSelection()!;
		selection.removeAllRanges();
		selection.addRange(range);

		const spy = vi.spyOn(document, 'activeElement', 'get').mockReturnValue(null);
		expect(toggleSelection()).toBeUndefined();

		spy.mockRestore();
		document.body.removeChild(el);
	});

	it('copyToClipboard: selection 无 removeRange 时降级到 removeAllRanges', () => {
		const selection = document.getSelection()!;
		const origRemoveRange = selection.removeRange;
		// @ts-ignore
		selection.removeRange = undefined;
		const removeAll = vi.spyOn(selection, 'removeAllRanges');

		expect(copyToClipboard('hello')).toBe(true);
		expect(removeAll).toHaveBeenCalled();

		// @ts-ignore
		selection.removeRange = origRemoveRange;
	});

	it('group.set: 复制内容', () => {
		expect(group.set('hello')).toBe(true);
	});

	it('group.clear: 复制空字符串', () => {
		const spy = vi.fn(() => true);
		(document.execCommand as any) = spy;

		expect(group.clear()).toBe(true);
		expect(spy).toHaveBeenCalledWith('copy');
	});

	it('group.get: 读取剪贴板内容', async () => {
		const readText = vi.fn(() => Promise.resolve('hello'));
		Object.defineProperty(navigator, 'clipboard', {
			value: { readText },
			configurable: true
		});

		await expect(group.get()).resolves.toBe('hello');
		expect(readText).toHaveBeenCalled();
	});

	it('group.clearSelection: 指向 toggleSelection', () => {
		expect(group.clearSelection).toBe(toggleSelection);
	});
});

describe('mobile', () => {
	it('create: 渲染 vcm-clipboard', () => {
		const wrapper = mount(() => (<MClipboard tag="span" />));

		expect(wrapper.element.tagName).toBe('SPAN');
	});

	it('click: 复制成功时调用 MToast 提示', async () => {
		const info = vi.spyOn(MToast, 'info').mockImplementation(() => ({}) as any);
		const wrapper = mount(() => (<MClipboard value="hello" />));

		await wrapper.trigger('click');

		expect(info).toHaveBeenCalledWith({ content: '复制成功' });
	});
});
