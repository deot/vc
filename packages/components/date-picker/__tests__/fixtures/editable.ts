import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { onTestFinished } from 'vitest';

// DatePicker / TimePicker 手动输入的测试共用

export const sleep = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));

export const flush = async () => {
	await nextTick();
	await sleep(0);
	await nextTick();
};

// 在当前焦点上按键（经 document 捕获阶段由统一的 Keyboard 分发）
export const press = (key: string) => {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
	(document.activeElement || document.body).dispatchEvent(event);
	return event;
};

// 改写输入框的文字，等弹层与面板更新完
export const typeInto = async (input: HTMLInputElement, text: string) => {
	input.value = text;
	input.dispatchEvent(new Event('input', { bubbles: true }));
	await flush();
	await sleep(20);
	await flush();
};

export const clickOutside = async () => {
	document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
	await flush();
	await sleep(20);
	await flush();
};

// 挂到 document 上，用例结束时卸载（否则失败的用例会把 Keyboard 订阅漏到后面）
export const mountAttached = async (render: () => any) => {
	const wrapper = mount(render, { attachTo: document.body });
	onTestFinished(() => wrapper.unmount());
	await flush();
	return wrapper;
};

// 挂载后聚焦第一个输入框；type 改写它的文字
export const mountTyping = async (render: () => any) => {
	const wrapper = await mountAttached(render);
	const input = wrapper.find('input').element as HTMLInputElement;
	input.focus();
	await flush();
	return { wrapper, input, type: (text: string) => typeInto(input, text) };
};
