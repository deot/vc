// @vitest-environment jsdom

import { Message, MessageView } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { vi } from 'vitest';

const MARKUP = '<b class="inner">text</b>';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Message).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<MessageView />));

		expect(wrapper.classes()).toContain('vc-message');
	});
});

describe('content', () => {
	afterEach(() => {
		Message.destroy();
		document.body.innerHTML = '';
	});

	it('字符串按文本渲染', () => {
		const wrapper = mount(MessageView, { props: { content: MARKUP } });
		const content = wrapper.find('.vc-message__content');

		expect(content.find('.inner').exists()).toBe(false);
		expect(content.text()).toBe(MARKUP);
		wrapper.unmount();
	});

	it('{ type, value } 按声明的类型渲染', () => {
		const wrapper = mount(MessageView, { props: { content: { type: 'html', value: MARKUP } } });
		expect(wrapper.find('.vc-message__content .inner').exists()).toBe(true);
		wrapper.unmount();

		const wrapper$ = mount(MessageView, { props: { content: { type: 'text', value: MARKUP } } });
		expect(wrapper$.find('.vc-message__content .inner').exists()).toBe(false);
		expect(wrapper$.find('.vc-message__content').text()).toBe(MARKUP);
		wrapper$.unmount();
	});

	it('渲染函数不加包裹元素，空内容不输出', () => {
		const wrapper = mount(MessageView, { props: { content: () => (<i class="render">text</i>) } });
		expect(wrapper.find('.render').exists()).toBe(true);
		expect(wrapper.find('.vc-message__content').exists()).toBe(false);
		wrapper.unmount();

		const wrapper$ = mount(MessageView, { props: { content: '' } });
		expect(wrapper$.find('.vc-message__content').exists()).toBe(false);
		wrapper$.unmount();
	});

	it('Message.info 传入 { type, value } 时作为内容，而不是选项', async () => {
		Message.info({ type: 'html', value: MARKUP });
		await nextTick();

		const content = document.body.querySelector('.vc-message__content')!;
		expect(content.querySelector('.inner')).not.toBe(null);
		expect(content.textContent).toBe('text');
	});

	it('Message.info 的位置参数与选项对象写法不变', async () => {
		Message.info(MARKUP, 0);
		Message.info({ content: { type: 'html', value: MARKUP }, duration: 0 });
		await nextTick();

		const [first, second] = [...document.body.querySelectorAll('.vc-message__content')];
		expect(first.querySelector('.inner')).toBe(null);
		expect(first.textContent).toBe(MARKUP);
		expect(second.querySelector('.inner')).not.toBe(null);
	});
});

describe('函数式调用的参数', () => {
	afterEach(() => {
		Message.destroy();
		document.body.innerHTML = '';
	});

	// 最终传给 MessageView 的属性
	const read = (leaf: any) => leaf.propsData.value;
	const html = { type: 'html', value: MARKUP };

	it('按位置传参', () => {
		const onClose = vi.fn();
		const leaf = Message.info('文字', 123, onClose);

		expect(read(leaf)).toMatchObject({ content: '文字', duration: 123, mode: 'info' });
		leaf.resolve();
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('传一个选项对象', () => {
		const onClose = vi.fn();
		const leaf = Message.error({ duration: 20, content: '文字', onClose });

		expect(read(leaf)).toMatchObject({ content: '文字', duration: 20, mode: 'error' });
		leaf.resolve();
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('两种写法混用：最后一位的对象是选项', () => {
		const leaf = Message.info('文字', { duration: 0, closable: true });
		expect(read(leaf)).toMatchObject({ content: '文字', duration: 0, closable: true });

		// 最后一位是 null 等于没传
		const leaf$ = Message.info('文字', null as any);
		expect(read(leaf$).content).toBe('文字');
		expect(read(leaf$)).not.toHaveProperty('duration');
	});

	it('{ type, value } 是内容，后面可以继续跟位置参数或选项对象', () => {
		const alone = read(Message.info(html));
		expect(alone.content).toEqual(html);
		expect(alone).not.toHaveProperty('type');
		expect(alone).not.toHaveProperty('value');

		expect(read(Message.info(html, 0))).toMatchObject({ content: html, duration: 0 });
		expect(read(Message.info(html, { duration: 0, closable: true }))).toMatchObject({ content: html, duration: 0, closable: true });
		expect(read(Message.info({ content: html, duration: 0 }))).toMatchObject({ content: html, duration: 0 });
	});

	it('上一次调用的参数不会留到下一次', () => {
		const onClose = vi.fn();
		Message.info('a', 0, onClose);
		const leaf = Message.info('b');

		expect(read(leaf).content).toBe('b');
		expect(read(leaf)).not.toHaveProperty('duration');
		leaf.resolve();
		expect(onClose).not.toHaveBeenCalled();
	});
});
