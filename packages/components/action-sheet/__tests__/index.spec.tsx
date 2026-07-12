// @vitest-environment jsdom

import { ActionSheet, MActionSheet } from '@deot/vc-components';
import { mount, config } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { vi } from 'vitest';

config.global.stubs.transition = false;
config.global.stubs['transition-group'] = false;

const sleep = (ms = 0) => new Promise<void>(resolve => setTimeout(resolve, ms));
const flush = async () => {
	await nextTick();
	await sleep(0);
	await nextTick();
};

const flushTransition = async (extra = 450) => {
	await nextTick();
	await sleep(extra);
	await nextTick();
	await nextTick();
};

const isVisible = (wrapper: any) => {
	const el = wrapper.find('.vcm-popup__wrapper').element as HTMLElement;
	return el.style.display !== 'none';
};

describe('index.ts', () => {
	afterEach(() => {
		MActionSheet.destroy();
		document.body.innerHTML = '';
	});

	it('basic exports', () => {
		expect(typeof ActionSheet).toBe('object');
		expect(typeof MActionSheet).toBe('object');
		expect(ActionSheet).toBe(MActionSheet);
		expect(typeof MActionSheet.open).toBe('function');
		expect(typeof MActionSheet.popup).toBe('function');
		expect(typeof MActionSheet.destroy).toBe('function');
	});

	it('create', async () => {
		const wrapper = mount(() => (<ActionSheet />), { attachTo: document.body });
		await flush();

		expect(wrapper.classes()).toContain('vcm-action-sheet');
		expect(wrapper.find('.vcm-popup').exists()).toBe(true);

		wrapper.unmount();
	});
});

describe('ActionSheet render', () => {
	afterEach(() => {
		MActionSheet.destroy();
		document.body.innerHTML = '';
	});

	it('title/content/subContent 字符串默认使用 innerHTML', async () => {
		const wrapper = mount(ActionSheet, {
			attachTo: document.body,
			props: {
				title: '<span class="title-html">标题</span>',
				cancelText: '取消',
				data: [
					{
						content: '<span class="content-html">内容</span>',
						subContent: '<span class="sub-html">二级内容</span>'
					}
				]
			}
		});
		await flush();

		expect(wrapper.find('.title-html').text()).toBe('标题');
		expect(wrapper.find('.content-html').text()).toBe('内容');
		expect(wrapper.find('.sub-html').text()).toBe('二级内容');
		expect(wrapper.find('.vcm-action-sheet__cancel').text()).toBe('取消');

		wrapper.unmount();
	});

	it('title/content/subContent 函数通过 MCustomer 渲染', async () => {
		const title = vi.fn(() => h('span', { class: 'title-fn' }, '函数标题'));
		const content = vi.fn(() => h('span', { class: 'content-fn' }, '函数内容'));
		const subContent = vi.fn(() => h('span', { class: 'sub-fn' }, '函数二级内容'));
		const wrapper = mount(ActionSheet, {
			attachTo: document.body,
			props: {
				title,
				data: [{ content, subContent }]
			}
		});
		await flush();

		expect(title).toHaveBeenCalled();
		expect(content).toHaveBeenCalled();
		expect(subContent).toHaveBeenCalled();
		expect(wrapper.find('.title-fn').text()).toBe('函数标题');
		expect(wrapper.find('.content-fn').text()).toBe('函数内容');
		expect(wrapper.find('.sub-fn').text()).toBe('函数二级内容');

		wrapper.unmount();
	});

	it('action class/style/disabled 渲染到 item', async () => {
		const wrapper = mount(ActionSheet, {
			attachTo: document.body,
			props: {
				data: [
					{
						content: '删除',
						class: 'is-danger-action',
						style: { color: 'rgb(255, 0, 0)' }
					},
					{
						content: '禁用',
						disabled: true
					}
				]
			}
		});
		await flush();

		const items = wrapper.findAll('.vcm-action-sheet__item');
		expect(items[0].classes()).toContain('is-danger-action');
		expect((items[0].element as HTMLElement).style.color).toBe('rgb(255, 0, 0)');
		expect(items[1].classes()).toContain('is-disabled');

		wrapper.unmount();
	});

	it('content 为空时不渲染内容节点', async () => {
		const wrapper = mount(ActionSheet, {
			attachTo: document.body,
			props: {
				data: [{}]
			}
		});
		await flush();

		expect(wrapper.find('.vcm-action-sheet__title').exists()).toBe(false);
		expect(wrapper.find('.vcm-action-sheet__content').exists()).toBe(false);
		expect(wrapper.find('.vcm-action-sheet__sub-content').exists()).toBe(false);

		wrapper.unmount();
	});
});

describe('ActionSheet action click', () => {
	afterEach(() => {
		MActionSheet.destroy();
		document.body.innerHTML = '';
	});

	it('无 onClick 时点击 action 关闭并 fulfilled action value', async () => {
		const style = { color: 'red' };
		const wrapper = mount(ActionSheet, {
			attachTo: document.body,
			props: {
				data: [
					{
						content: '确认',
						subContent: '说明',
						class: 'custom-action',
						style
					}
				]
			}
		});
		await flush();

		await wrapper.find('.vcm-action-sheet__item').trigger('click');
		await flushTransition();

		const value = wrapper.emitted('portal-fulfilled')!.at(-1)![0] as any;
		expect(value).toEqual({
			content: '确认',
			subContent: '说明',
			class: 'custom-action',
			style
		});
		expect(isVisible(wrapper)).toBe(false);

		wrapper.unmount();
	}, 10000);

	it('onClick 接收完整 action, 不再接收 done', async () => {
		const onClick = vi.fn(() => false);
		const wrapper = mount(ActionSheet, {
			attachTo: document.body,
			props: {
				data: [{ content: '确认', onClick }]
			}
		});
		await flush();

		await wrapper.find('.vcm-action-sheet__item').trigger('click');
		await flush();

		expect(onClick).toHaveBeenCalledWith({ content: '确认', onClick });
		expect(onClick.mock.calls[0]).toHaveLength(1);
		expect(wrapper.emitted('portal-fulfilled')).toBeFalsy();
		expect(isVisible(wrapper)).toBe(true);

		wrapper.unmount();
	});

	it('返回 false 阻止关闭', async () => {
		const wrapper = mount(ActionSheet, {
			attachTo: document.body,
			props: {
				data: [{ content: '保留', onClick: () => false }]
			}
		});
		await flush();

		await wrapper.find('.vcm-action-sheet__item').trigger('click');
		await flush();

		expect(wrapper.emitted('portal-fulfilled')).toBeFalsy();
		expect(isVisible(wrapper)).toBe(true);

		wrapper.unmount();
	});

	it('Promise.resolve(false) 阻止关闭并清理 loading', async () => {
		const wrapper = mount(ActionSheet, {
			attachTo: document.body,
			props: {
				data: [{ content: '保留', onClick: () => Promise.resolve(false) }]
			}
		});
		await flush();

		await wrapper.find('.vcm-action-sheet__item').trigger('click');
		await flush();

		expect(wrapper.emitted('portal-fulfilled')).toBeFalsy();
		expect(wrapper.find('.vcm-action-sheet__loading').exists()).toBe(false);
		expect(isVisible(wrapper)).toBe(true);

		wrapper.unmount();
	});

	it('Promise.reject 阻止关闭并清理 loading', async () => {
		const wrapper = mount(ActionSheet, {
			attachTo: document.body,
			props: {
				data: [{ content: '保留', onClick: () => Promise.reject() }]
			}
		});
		await flush();

		await wrapper.find('.vcm-action-sheet__item').trigger('click');
		await flush();

		expect(wrapper.emitted('portal-fulfilled')).toBeFalsy();
		expect(wrapper.find('.vcm-action-sheet__loading').exists()).toBe(false);
		expect(isVisible(wrapper)).toBe(true);

		wrapper.unmount();
	});

	it('Promise 成功时展示 loading, resolve 后关闭', async () => {
		let resolve!: () => void;
		const onClick = vi.fn(() => new Promise<void>(r => (resolve = r)));
		const secondClick = vi.fn();
		const wrapper = mount(ActionSheet, {
			attachTo: document.body,
			props: {
				data: [
					{ content: '异步', subContent: '异步说明', onClick },
					{ content: '重复点击', onClick: secondClick }
				]
			}
		});
		await flush();

		const items = wrapper.findAll('.vcm-action-sheet__item');
		await items[0].trigger('click');
		await flush();

		expect(onClick).toHaveBeenCalledTimes(1);
		expect(wrapper.find('.vcm-action-sheet__loading').exists()).toBe(true);
		expect(items[0].find('.vcm-action-sheet__content').text()).toBe('异步');
		expect(items[0].find('.vcm-action-sheet__sub-content').text()).toBe('异步说明');
		await items[1].trigger('click');
		await flush();
		expect(secondClick).not.toHaveBeenCalled();

		resolve();
		await flushTransition();

		const value = wrapper.emitted('portal-fulfilled')!.at(-1)![0];
		expect(value).toEqual({ content: '异步', subContent: '异步说明', onClick });
		expect(isVisible(wrapper)).toBe(false);

		wrapper.unmount();
	}, 10000);

	it('loading 时函数 content/subContent 接收 loading 参数', async () => {
		let resolve!: () => void;
		const content = vi.fn((attrs: any) => h('span', { class: 'content-loading' }, String(attrs.loading)));
		const subContent = vi.fn((attrs: any) => h('span', { class: 'sub-content-loading' }, String(attrs.loading)));
		const wrapper = mount(ActionSheet, {
			attachTo: document.body,
			props: {
				data: [
					{
						content,
						subContent,
						onClick: () => new Promise<void>(r => (resolve = r))
					}
				]
			}
		});
		await flush();

		await wrapper.find('.vcm-action-sheet__item').trigger('click');
		await flush();

		expect(wrapper.find('.vcm-action-sheet__loading').exists()).toBe(true);
		expect(content.mock.calls.some(([attrs]) => attrs.loading === true)).toBe(true);
		expect(subContent.mock.calls.some(([attrs]) => attrs.loading === true)).toBe(true);
		expect(wrapper.find('.content-loading').text()).toBe('true');
		expect(wrapper.find('.sub-content-loading').text()).toBe('true');

		resolve();
		await flushTransition();
		wrapper.unmount();
	}, 10000);

	it('disabled action 不触发 onClick', async () => {
		const onClick = vi.fn();
		const wrapper = mount(ActionSheet, {
			attachTo: document.body,
			props: {
				data: [{ content: '禁用', disabled: true, onClick }]
			}
		});
		await flush();

		await wrapper.find('.vcm-action-sheet__item').trigger('click');
		await flush();

		expect(onClick).not.toHaveBeenCalled();
		expect(isVisible(wrapper)).toBe(true);

		wrapper.unmount();
	});
});

describe('ActionSheet close and portal methods', () => {
	afterEach(() => {
		MActionSheet.destroy();
		document.body.innerHTML = '';
	});

	it('cancelText 点击关闭并 fulfilled undefined', async () => {
		const wrapper = mount(ActionSheet, {
			attachTo: document.body,
			props: {
				cancelText: '取消',
				data: [{ content: '确认' }]
			}
		});
		await flush();

		await wrapper.find('.vcm-action-sheet__cancel').trigger('click');
		await flushTransition();

		expect(wrapper.emitted('portal-fulfilled')!.at(-1)![0]).toBeUndefined();
		expect(isVisible(wrapper)).toBe(false);

		wrapper.unmount();
	}, 10000);

	it('maskClosable=true 点击 mask 关闭', async () => {
		const wrapper = mount(ActionSheet, {
			attachTo: document.body,
			props: {
				maskClosable: true,
				data: [{ content: '确认' }]
			}
		});
		await flush();

		await wrapper.find('.vcm-popup__mask').trigger('click');
		await flushTransition();

		expect(wrapper.emitted('portal-fulfilled')).toBeTruthy();
		expect(isVisible(wrapper)).toBe(false);

		wrapper.unmount();
	}, 10000);

	it('loading 时点击 mask 不关闭', async () => {
		let resolve!: () => void;
		const wrapper = mount(ActionSheet, {
			attachTo: document.body,
			props: {
				data: [
					{
						content: '异步',
						onClick: () => new Promise<void>(r => (resolve = r))
					}
				]
			}
		});
		await flush();

		await wrapper.find('.vcm-action-sheet__item').trigger('click');
		await flush();
		await wrapper.find('.vcm-popup__mask').trigger('click');
		await flush();

		expect(wrapper.emitted('portal-fulfilled')).toBeFalsy();
		expect(isVisible(wrapper)).toBe(true);

		resolve();
		await flushTransition();
		wrapper.unmount();
	}, 10000);

	it('loading 时点击 cancel 不关闭, 异步 action resolve 后 fulfilled action value', async () => {
		let resolve!: () => void;
		const onClick = () => new Promise<void>(r => (resolve = r));
		const wrapper = mount(ActionSheet, {
			attachTo: document.body,
			props: {
				cancelText: '取消',
				data: [
					{
						content: '异步',
						onClick
					}
				]
			}
		});
		await flush();

		await wrapper.find('.vcm-action-sheet__item').trigger('click');
		await flush();
		expect(wrapper.find('.vcm-action-sheet__loading').exists()).toBe(true);

		await wrapper.find('.vcm-action-sheet__cancel').trigger('click');
		await flush();
		expect(wrapper.emitted('portal-fulfilled')).toBeFalsy();
		expect(isVisible(wrapper)).toBe(true);

		resolve();
		await flushTransition();

		const fulfilled = wrapper.emitted('portal-fulfilled')!;
		expect(fulfilled).toHaveLength(1);
		expect(fulfilled[0][0]).toEqual({ content: '异步', onClick });
		expect(isVisible(wrapper)).toBe(false);

		wrapper.unmount();
	}, 10000);

	it('MActionSheet.open 渲染到 body 并返回 promise-like leaf', async () => {
		const onClose = vi.fn();
		const leaf = MActionSheet.open({
			title: 'open-title',
			onClose,
			data: [{ content: 'open-action' }]
		});
		await flush();

		expect(document.body.querySelector('.vcm-action-sheet')).not.toBeNull();
		expect(document.body.querySelector('.vcm-action-sheet__title')!.innerHTML).toContain('open-title');
		(document.body.querySelector('.vcm-action-sheet__item') as HTMLElement).click();
		await flushTransition();

		const result = await leaf.target;
		expect(result).toEqual({ content: 'open-action' });
		expect(onClose).toHaveBeenCalledWith({ content: 'open-action' });
	}, 10000);

	it('MActionSheet.popup 同 open', async () => {
		const leaf = MActionSheet.popup({
			data: [{ content: 'popup-action' }]
		});
		await flush();

		expect(document.body.querySelector('.vcm-action-sheet')).not.toBeNull();
		(document.body.querySelector('.vcm-action-sheet__item') as HTMLElement).click();
		await flushTransition();

		await expect(leaf.target).resolves.toEqual({ content: 'popup-action' });
	}, 10000);

	it('MActionSheet.open 支持空参数', async () => {
		const leaf = MActionSheet.open();
		await flush();

		expect(document.body.querySelector('.vcm-action-sheet')).not.toBeNull();

		leaf.destroy();
	});

	it('MActionSheet.destroy 清理全部 action-sheet portal', async () => {
		MActionSheet.open({ data: [{ content: 'a' }] });
		MActionSheet.open({ data: [{ content: 'b' }] });
		await flush();

		expect(document.body.querySelectorAll('.vcm-action-sheet').length).toBeGreaterThanOrEqual(2);
		MActionSheet.destroy();
		await flush();
		expect(document.body.querySelectorAll('.vcm-action-sheet')).toHaveLength(0);
	});
});
