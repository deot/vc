// @vitest-environment jsdom

import { Popconfirm } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { vi } from 'vitest';

const sleep = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));

const flush = async () => {
	await nextTick();
	await sleep(0);
	await nextTick();
};

const fireClick = (el: Element) => {
	el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
};

const getWrapperEl = () => document.querySelector('.vc-popconfirm-wrapper') as HTMLElement | null;
const getFooterButtons = () => Array.from(document.querySelectorAll('.vc-popconfirm__footer .vc-button')) as HTMLElement[];

describe('index.ts', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('basic', () => {
		expect(typeof Popconfirm).toBe('object');
	});

	it('create', async () => {
		const wrapper = mount(() => (<Popconfirm portal={false} />));

		expect(wrapper.classes()).toContain('vc-popconfirm');

		wrapper.unmount();
	});
});

describe('Popconfirm 内容渲染', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('title: 字符串渲染', async () => {
		const wrapper = mount(() => (
			<Popconfirm modelValue={true} portal={false} title="确认标题">
				<button>btn</button>
			</Popconfirm>
		), { attachTo: document.body });
		await flush();

		const title = document.querySelector('.vc-popconfirm__title') as HTMLElement;
		expect(title).not.toBeNull();
		expect(title.textContent).toContain('确认标题');

		wrapper.unmount();
	});

	it('title: 函数渲染走 Customer', async () => {
		const renderFn = vi.fn(() => (<span class="title-fn">fn-title</span>) as any);
		const wrapper = mount(() => (
			<Popconfirm modelValue={true} portal={false} title={renderFn}>
				<button>btn</button>
			</Popconfirm>
		), { attachTo: document.body });
		await flush();

		expect(renderFn).toHaveBeenCalled();
		expect(document.querySelector('.title-fn')).not.toBeNull();

		wrapper.unmount();
	});

	it('content: 字符串渲染', async () => {
		const wrapper = mount(() => (
			<Popconfirm modelValue={true} portal={false} content="确认内容">
				<button>btn</button>
			</Popconfirm>
		), { attachTo: document.body });
		await flush();

		const content = document.querySelector('.vc-popconfirm__content') as HTMLElement;
		expect(content).not.toBeNull();
		expect(content.textContent).toContain('确认内容');

		wrapper.unmount();
	});

	it('content: 函数渲染走 Customer', async () => {
		const renderFn = vi.fn(() => (<span class="content-fn">fn-content</span>) as any);
		const wrapper = mount(() => (
			<Popconfirm modelValue={true} portal={false} content={renderFn}>
				<button>btn</button>
			</Popconfirm>
		), { attachTo: document.body });
		await flush();

		expect(renderFn).toHaveBeenCalled();
		expect(document.querySelector('.content-fn')).not.toBeNull();

		wrapper.unmount();
	});

	it('slot title/content/icon 优先于 props', async () => {
		const wrapper = mount(() => (
			<Popconfirm modelValue={true} portal={false} title="prop-title" content="prop-content">
				{{
					default: () => <button>btn</button>,
					title: () => <span class="slot-title">slot-title</span>,
					content: () => <span class="slot-content">slot-content</span>,
					icon: () => <span class="slot-icon">slot-icon</span>
				}}
			</Popconfirm>
		), { attachTo: document.body });
		await flush();

		expect(document.querySelector('.slot-title')).not.toBeNull();
		expect(document.querySelector('.slot-content')).not.toBeNull();
		expect(document.querySelector('.slot-icon')).not.toBeNull();
		expect(document.body.innerHTML).not.toContain('prop-title');
		expect(document.body.innerHTML).not.toContain('prop-content');

		wrapper.unmount();
	});

	it('default slot 渲染触发节点', async () => {
		const wrapper = mount(() => (
			<Popconfirm portal={false}>
				<button class="trigger-btn">触发</button>
			</Popconfirm>
		), { attachTo: document.body });
		await flush();

		expect(wrapper.find('.trigger-btn').exists()).toBe(true);

		wrapper.unmount();
	});

	it('type: 默认 warning 图标类名', async () => {
		const wrapper = mount(() => (
			<Popconfirm modelValue={true} portal={false} title="x">
				<button>btn</button>
			</Popconfirm>
		), { attachTo: document.body });
		await flush();

		const icon = document.querySelector('.vc-popconfirm__icon') as HTMLElement;
		expect(icon).not.toBeNull();
		expect(icon.classList.contains('is-warning')).toBe(true);

		wrapper.unmount();
	});

	it('type: info 图标类名', async () => {
		const wrapper = mount(() => (
			<Popconfirm modelValue={true} portal={false} title="x" type="info">
				<button>btn</button>
			</Popconfirm>
		), { attachTo: document.body });
		await flush();

		const icon = document.querySelector('.vc-popconfirm__icon') as HTMLElement;
		expect(icon.classList.contains('is-info')).toBe(true);

		wrapper.unmount();
	});

	it('width: 设置弹层宽度', async () => {
		const wrapper = mount(() => (
			<Popconfirm modelValue={true} portal={false} title="x" width={300}>
				<button>btn</button>
			</Popconfirm>
		), { attachTo: document.body });
		await flush();

		const inner = document.querySelector('.vc-popconfirm__wrapper') as HTMLElement;
		expect(inner).not.toBeNull();
		expect(inner.style.width).toBe('300px');

		wrapper.unmount();
	});
});

describe('Popconfirm 按钮', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('okText/cancelText: 默认按钮文字', async () => {
		const wrapper = mount(() => (
			<Popconfirm modelValue={true} portal={false} title="x">
				<button>btn</button>
			</Popconfirm>
		), { attachTo: document.body });
		await flush();

		const [cancel, ok] = getFooterButtons();
		expect(cancel.textContent).toContain('取消');
		expect(ok.textContent).toContain('确定');

		wrapper.unmount();
	});

	it('okText/cancelText: 自定义按钮文字', async () => {
		const wrapper = mount(() => (
			<Popconfirm modelValue={true} portal={false} title="x" okText="Yes" cancelText="No">
				<button>btn</button>
			</Popconfirm>
		), { attachTo: document.body });
		await flush();

		const [cancel, ok] = getFooterButtons();
		expect(cancel.textContent).toContain('No');
		expect(ok.textContent).toContain('Yes');

		wrapper.unmount();
	});

	it('okType/cancelType: 按钮类型类名', async () => {
		const wrapper = mount(() => (
			<Popconfirm modelValue={true} portal={false} title="x" okType="success" cancelType="warning">
				<button>btn</button>
			</Popconfirm>
		), { attachTo: document.body });
		await flush();

		const [cancel, ok] = getFooterButtons();
		expect(cancel.classList.contains('is-warning')).toBe(true);
		expect(ok.classList.contains('is-success')).toBe(true);

		wrapper.unmount();
	});
});

describe('Popconfirm 事件', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('ok: 点击确定触发 ok 并关闭', async () => {
		const onOk = vi.fn();
		const onVisibleChange = vi.fn();
		const onUpdate = vi.fn();
		const visible = ref(true);
		const wrapper = mount(() => (
			<Popconfirm
				v-model={visible.value}
				portal={false}
				title="x"
				onOk={onOk}
				onVisibleChange={onVisibleChange}
				// @ts-ignore
				{...{ 'onUpdate:modelValue': onUpdate }}
			>
				<button>btn</button>
			</Popconfirm>
		), { attachTo: document.body });
		await flush();

		const [, ok] = getFooterButtons();
		fireClick(ok);
		await flush();

		expect(onOk).toHaveBeenCalledTimes(1);
		expect(onUpdate).toHaveBeenLastCalledWith(false);
		expect(onVisibleChange).toHaveBeenLastCalledWith(false);

		wrapper.unmount();
	});

	it('cancel: 点击取消触发 cancel 并关闭', async () => {
		const onCancel = vi.fn();
		const onVisibleChange = vi.fn();
		const visible = ref(true);
		const wrapper = mount(() => (
			<Popconfirm
				v-model={visible.value}
				portal={false}
				title="x"
				onCancel={onCancel}
				onVisibleChange={onVisibleChange}
			>
				<button>btn</button>
			</Popconfirm>
		), { attachTo: document.body });
		await flush();

		const [cancel] = getFooterButtons();
		fireClick(cancel);
		await flush();

		expect(onCancel).toHaveBeenCalledTimes(1);
		expect(onVisibleChange).toHaveBeenLastCalledWith(false);

		wrapper.unmount();
	});

	it('ok: 返回 Promise 时 resolve 后关闭', async () => {
		const onVisibleChange = vi.fn();
		const onOk = vi.fn(() => Promise.resolve('done'));
		const visible = ref(true);
		const wrapper = mount(() => (
			<Popconfirm
				v-model={visible.value}
				portal={false}
				title="x"
				onOk={onOk}
				onVisibleChange={onVisibleChange}
			>
				<button>btn</button>
			</Popconfirm>
		), { attachTo: document.body });
		await flush();

		const [, ok] = getFooterButtons();
		fireClick(ok);
		await flush();

		expect(onOk).toHaveBeenCalledTimes(1);
		expect(onVisibleChange).toHaveBeenLastCalledWith(false);

		wrapper.unmount();
	});

	it('ready: 弹出时触发 ready', async () => {
		const onReady = vi.fn();
		const visible = ref(false);
		const wrapper = mount(() => (
			<Popconfirm v-model={visible.value} portal={false} title="x" onReady={onReady}>
				<button>btn</button>
			</Popconfirm>
		), { attachTo: document.body });
		await flush();

		visible.value = true;
		await flush();

		expect(onReady).toHaveBeenCalled();

		wrapper.unmount();
	});

	it('v-model: 外部控制显隐', async () => {
		const visible = ref(false);
		const wrapper = mount(() => (
			<Popconfirm v-model={visible.value} portal={false} title="x">
				<button>btn</button>
			</Popconfirm>
		), { attachTo: document.body });
		await flush();

		expect(getWrapperEl()).toBeNull();

		visible.value = true;
		await flush();
		expect(getWrapperEl()).not.toBeNull();
		expect(getWrapperEl()!.style.display).not.toBe('none');

		wrapper.unmount();
	});

	it('trigger="click": 点击触发节点弹出', async () => {
		const wrapper = mount(() => (
			<Popconfirm portal={false} trigger="click" title="x">
				<button class="trigger-btn">btn</button>
			</Popconfirm>
		), { attachTo: document.body });
		await flush();

		expect(getWrapperEl()).toBeNull();

		await wrapper.trigger('click');
		await flush();

		expect(getWrapperEl()).not.toBeNull();
		expect(getWrapperEl()!.style.display).not.toBe('none');

		wrapper.unmount();
	});
});
