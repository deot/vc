// @vitest-environment jsdom

import { vi } from 'vitest';
import { Button, Clipboard, MClipboard, Message, MToast, VcInstance } from '@deot/vc-components';
import { enUS, zhCN } from '@deot/vc-locale';
import { mount } from '@vue/test-utils';
import { markRaw } from 'vue';
import { copyToClipboard, toggleSelection, group } from '../utils';

// jsdom 未实现 execCommand 和 ClipboardEvent，按浏览器行为派发 copy 事件并记录写入的格式
let written: Record<string, string>;
let prevented: boolean;
const mockCopy = () => vi.fn(() => {
	written = {};
	const e = new Event('copy', { cancelable: true }) as any;
	e.clipboardData = { setData: (type: string, value: string) => { written[type] = value; } };
	document.dispatchEvent(e);
	prevented = e.defaultPrevented;
	return true;
});

beforeEach(() => {
	written = {};
	document.execCommand = mockCopy();
});

afterEach(() => {
	VcInstance.configure({ locale: zhCN });
	vi.restoreAllMocks();
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
	it.each([Clipboard, MClipboard])('component tag: 保留函数插槽和复制行为，不产生警告', async (Component) => {
		const warnings: string[] = [];
		const onAfter = vi.fn();
		const wrapper = mount(Component, {
			props: { tag: markRaw(Button), value: 'hello' },
			attrs: { size: 'small', onAfter },
			slots: { default: () => '复制' },
			global: { config: { warnHandler: (message) => { warnings.push(message); } } }
		});

		expect(wrapper.findComponent(Button).text()).toBe('复制');
		expect(wrapper.findComponent(Button).props('size')).toBe('small');
		await wrapper.trigger('click');
		expect(onAfter).toHaveBeenCalledWith('hello');
		expect(warnings).toEqual([]);
		wrapper.unmount();
	});

	it.each([Clipboard, MClipboard])('locale: 点击时读取当前语言，after 覆盖默认提示', async (Component) => {
		const success = vi.spyOn(Message, 'success').mockImplementation(() => ({}) as any);
		const info = vi.spyOn(MToast, 'info').mockImplementation(() => ({}) as any);
		const feedback = Component === Clipboard ? success : info;
		const wrapper = mount(Component, { props: { value: 'hello' } });

		await wrapper.trigger('click');
		expect(feedback).toHaveBeenLastCalledWith({ content: '复制成功' });
		VcInstance.configure({ locale: enUS });
		await wrapper.trigger('click');
		expect(feedback).toHaveBeenLastCalledWith({ content: 'Copied successfully' });
		VcInstance.configure({ locale: zhCN });
		await wrapper.trigger('click');
		expect(feedback).toHaveBeenLastCalledWith({ content: '复制成功' });

		const onAfter = vi.fn();
		const custom = mount(Component, { props: { value: 'hello' }, attrs: { onAfter } });
		await custom.trigger('click');
		expect(onAfter).toHaveBeenCalledWith('hello');
		expect(feedback).toHaveBeenCalledTimes(3);
		wrapper.unmount();
		custom.unmount();
	});

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

	it('value: 对象按 MIME 类型写入，before / after 透传对象', async () => {
		const value = { 'text/plain': 'a\tb', 'text/html': '<table><tr><td>a</td><td>b</td></tr></table>' };
		const onBefore = vi.fn((_e: any, v: any) => ({ ...v, 'text/html': `<b>${v['text/html']}</b>` }));
		const onAfter = vi.fn();
		const wrapper = mount(() => (
			<Clipboard value={value} onBefore={onBefore} onAfter={onAfter} />
		));

		await wrapper.trigger('click');

		expect(onBefore).toHaveBeenCalledWith(expect.anything(), value);
		expect(written).toEqual({ 'text/plain': 'a\tb', 'text/html': `<b>${value['text/html']}</b>` });
		expect(onAfter).toHaveBeenCalledWith(written);
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
		const success = vi.spyOn(Message, 'success').mockImplementation(() => ({}) as any);
		const onAfter = vi.fn();
		const wrapper = mount(() => (<Clipboard value="hello" onAfter={onAfter} />));

		await wrapper.trigger('click');

		expect(success).not.toHaveBeenCalled();
		expect(onAfter).not.toHaveBeenCalled();
	});
});

describe('utils.ts', () => {
	it('copyToClipboard: 成功返回 true，字符串只写纯文本', () => {
		expect(copyToClipboard('hello')).toBe(true);
		expect(written).toEqual({ 'text/plain': 'hello' });
	});

	it('copyToClipboard: 对象一次写入多种格式，事件被阻止默认行为', () => {
		expect(copyToClipboard({ 'text/plain': 'a', 'text/html': '<b>a</b>' })).toBe(true);
		expect(written).toEqual({ 'text/plain': 'a', 'text/html': '<b>a</b>' });
		expect(prevented).toBe(true);
	});

	it('copyToClipboard: 结束后移除 copy 监听，不影响用户之后的复制', () => {
		copyToClipboard({ 'text/html': '<b>a</b>' });
		written = {};
		const e = new Event('copy', { cancelable: true }) as any;
		e.clipboardData = { setData: (type: string, value: string) => { written[type] = value; } };
		document.dispatchEvent(e);

		expect(written).toEqual({});
		expect(e.defaultPrevented).toBe(false);
	});

	it('copyToClipboard: execCommand 返回 false 或抛错时返回 false', () => {
		(document.execCommand as any) = vi.fn(() => false);
		expect(copyToClipboard('hello')).toBe(false);

		(document.execCommand as any) = vi.fn(() => { throw new Error('fail'); });
		expect(copyToClipboard('hello')).toBe(false);
	});

	it('copyToClipboard: 未传内容时写入空文本', () => {
		expect(copyToClipboard()).toBe(true);
		expect(written).toEqual({ 'text/plain': '' });
	});

	it('copyToClipboard: copy 事件没有 clipboardData 时交给浏览器默认行为', () => {
		(document.execCommand as any) = vi.fn(() => {
			const e = new Event('copy', { cancelable: true });
			document.dispatchEvent(e);
			prevented = e.defaultPrevented;
			return true;
		});

		expect(copyToClipboard('hello')).toBe(true);
		expect(prevented).toBe(false);
	});

	it('copyToClipboard: 有选区但没有 activeElement 时仍能复制', () => {
		const el = document.createElement('div');
		el.textContent = 'hello';
		document.body.appendChild(el);
		const range = document.createRange();
		range.selectNodeContents(el);
		document.getSelection()!.addRange(range);
		vi.spyOn(document, 'activeElement', 'get').mockReturnValue(null);

		expect(copyToClipboard('hello')).toBe(true);
		expect(written).toEqual({ 'text/plain': 'hello' });

		document.body.removeChild(el);
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

	it('toggleSelection: activeElement 为空时同样清除并还原选区', () => {
		const el = document.createElement('div');
		el.textContent = 'hello';
		document.body.appendChild(el);

		const range = document.createRange();
		range.selectNodeContents(el);
		const selection = document.getSelection()!;
		selection.removeAllRanges();
		selection.addRange(range);

		const spy = vi.spyOn(document, 'activeElement', 'get').mockReturnValue(null);
		const restore = toggleSelection();
		expect(selection.rangeCount).toBe(0);
		restore();
		expect(selection.rangeCount).toBe(1);

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
		expect(group.clear()).toBe(true);
		expect(document.execCommand).toHaveBeenCalledWith('copy');
		expect(written).toEqual({ 'text/plain': '' });
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
