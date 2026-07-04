// @vitest-environment jsdom

import { Notice, NoticeView } from '@deot/vc-components';
import { mount, config } from '@vue/test-utils';
import { Utils } from '@deot/dev-test';
import { nextTick, h } from 'vue';
import { vi } from 'vitest';

// @vue/test-utils 默认会把 Transition 替换成 stub, 导致 onAfterLeave 不会触发
config.global.stubs.transition = false;
config.global.stubs['transition-group'] = false;

const flush = async () => {
	await nextTick();
	await Utils.sleep(0);
	await nextTick();
};

const isVisible = (wrapper: any) => {
	const el = wrapper.find('.vc-notice__wrapper').element as HTMLElement;
	return el.style.display !== 'none';
};

// TransitionSlide 默认 leave duration=300ms
const flushTransition = async (extra = 400) => {
	await nextTick();
	await Utils.sleep(extra);
	await nextTick();
	await nextTick();
};

describe('index.ts', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		Notice.destroy();
	});

	it('basic', () => {
		expect(typeof Notice).toBe('object');
		expect(typeof NoticeView).toBe('object');
		expect(typeof Notice.open).toBe('function');
		expect(typeof Notice.info).toBe('function');
		expect(typeof Notice.success).toBe('function');
		expect(typeof Notice.warning).toBe('function');
		expect(typeof Notice.error).toBe('function');
		expect(typeof Notice.destroy).toBe('function');
	});

	it('create', async () => {
		const wrapper = mount(() => (<NoticeView />));

		expect(wrapper.classes()).toContain('vc-notice');

		wrapper.unmount();
	});
});

describe('NoticeView 渲染', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('fixed: 默认固定定位并设置 top', async () => {
		const wrapper = mount(NoticeView, { props: { top: 30 } });
		await flush();

		expect(wrapper.classes()).toContain('is-fixed');
		expect((wrapper.element as HTMLElement).style.top).toBe('30px');

		wrapper.unmount();
	});

	it('fixed=false: 无固定定位且无 top', async () => {
		const wrapper = mount(NoticeView, { props: { fixed: false, top: 30 } });
		await flush();

		expect(wrapper.classes()).not.toContain('is-fixed');
		expect((wrapper.element as HTMLElement).style.top).toBe('');

		wrapper.unmount();
	});

	it('title/content: 字符串渲染', async () => {
		const wrapper = mount(NoticeView, {
			props: { title: '标题内容', content: '正文内容' }
		});
		await flush();

		const title = wrapper.find('.vc-notice__title');
		const content = wrapper.find('.vc-notice__content');
		expect(title.exists()).toBe(true);
		expect(title.text()).toContain('标题内容');
		expect(content.exists()).toBe(true);
		expect(content.text()).toContain('正文内容');

		wrapper.unmount();
	});

	it('title/content: 函数渲染走 Customer', async () => {
		const titleFn = vi.fn(() => h('span', { class: 'title-fn' }, 'fn-title'));
		const contentFn = vi.fn(() => h('span', { class: 'content-fn' }, 'fn-content'));
		const wrapper = mount(NoticeView, {
			props: { title: titleFn, content: contentFn }
		});
		await flush();

		expect(titleFn).toHaveBeenCalled();
		expect(contentFn).toHaveBeenCalled();
		expect(wrapper.find('.title-fn').exists()).toBe(true);
		expect(wrapper.find('.content-fn').exists()).toBe(true);

		wrapper.unmount();
	});

	it('content 为空时不渲染内容容器', async () => {
		const wrapper = mount(NoticeView, { props: { title: '仅标题' } });
		await flush();

		expect(wrapper.find('.vc-notice__title').exists()).toBe(true);
		expect(wrapper.find('.vc-notice__content').exists()).toBe(false);

		wrapper.unmount();
	});

	it('mode: 渲染对应图标类名', async () => {
		const wrapper = mount(NoticeView, { props: { mode: 'success', content: 'x' } });
		await flush();

		const icon = wrapper.find('.vc-notice__icon');
		expect(icon.exists()).toBe(true);
		expect(icon.classes()).toContain('is-success');

		wrapper.unmount();
	});

	it('mode 为空: 不渲染图标', async () => {
		const wrapper = mount(NoticeView, { props: { content: 'x' } });
		await flush();

		expect(wrapper.find('.vc-notice__icon').exists()).toBe(false);

		wrapper.unmount();
	});

	it('closable=true: 渲染关闭图标', async () => {
		const wrapper = mount(NoticeView, { props: { content: 'x' } });
		await flush();

		expect(wrapper.find('.vc-notice__close').exists()).toBe(true);

		wrapper.unmount();
	});

	it('closable=false: 不渲染关闭图标', async () => {
		const wrapper = mount(NoticeView, { props: { content: 'x', closable: false } });
		await flush();

		expect(wrapper.find('.vc-notice__close').exists()).toBe(false);

		wrapper.unmount();
	});

	it('title/content 非 string/function 时不渲染内部节点', async () => {
		const wrapper = mount(NoticeView, {
			props: { title: 123 as any, content: true as any }
		});
		await flush();

		expect(wrapper.find('.vc-notice__title').exists()).toBe(true);
		expect(wrapper.find('.vc-notice__title').text()).toBe('');
		expect(wrapper.find('.vc-notice__content').exists()).toBe(true);
		expect(wrapper.find('.vc-notice__content').text()).toBe('');

		wrapper.unmount();
	});

	it('watch title/content: props 变化时同步内容', async () => {
		const wrapper = mount(NoticeView, {
			attachTo: document.body,
			props: { title: '标题A', content: '内容A' }
		});
		await flush();

		expect(wrapper.find('.vc-notice__title').text()).toContain('标题A');
		expect(wrapper.find('.vc-notice__content').text()).toContain('内容A');

		await wrapper.setProps({ title: '标题B', content: '内容B' });
		await flush();

		expect(wrapper.find('.vc-notice__title').text()).toContain('标题B');
		expect(wrapper.find('.vc-notice__content').text()).toContain('内容B');

		wrapper.unmount();
	});
});

describe('NoticeView 交互与事件', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('exposed close/remove/destroy/hide 触发 close 与 portal-fulfilled', async () => {
		for (const key of ['close', 'remove', 'destroy', 'hide'] as const) {
			const wrapper = mount(NoticeView, {
				attachTo: document.body,
				props: { content: 'x', duration: 0 }
			});
			await flush();

			(wrapper.vm as any)[key]();
			await flush();

			expect(wrapper.emitted('close')).toBeTruthy();
			expect(wrapper.emitted('portal-fulfilled')).toBeTruthy();

			wrapper.unmount();
		}
	});

	it('exposed setContent 更新内容', async () => {
		const wrapper = mount(NoticeView, {
			attachTo: document.body,
			props: { content: '初始内容' }
		});
		await flush();
		expect(wrapper.find('.vc-notice__content').text()).toContain('初始内容');

		(wrapper.vm as any).setContent('更新后的内容');
		await flush();
		expect(wrapper.find('.vc-notice__content').text()).toContain('更新后的内容');

		wrapper.unmount();
	});

	it('点击关闭图标触发 onBeforeClose', async () => {
		const onBeforeClose = vi.fn(() => true);
		const wrapper = mount(NoticeView, {
			attachTo: document.body,
			props: { content: 'x', duration: 0, onBeforeClose }
		});
		await flush();

		await wrapper.find('.vc-notice__close').trigger('click');
		await flushTransition();

		expect(onBeforeClose).toHaveBeenCalledTimes(1);
		expect(isVisible(wrapper)).toBe(false);

		wrapper.unmount();
	}, 10000);

	it('onBeforeClose 返回 Promise 时 resolve 后关闭', async () => {
		const onBeforeClose = vi.fn(() => Promise.resolve());
		const wrapper = mount(NoticeView, {
			attachTo: document.body,
			props: { content: 'x', duration: 0, onBeforeClose }
		});
		await flush();

		await wrapper.find('.vc-notice__close').trigger('click');
		await flushTransition();

		expect(onBeforeClose).toHaveBeenCalledTimes(1);
		expect(wrapper.emitted('close')).toBeTruthy();

		wrapper.unmount();
	}, 10000);

	it('onBeforeClose 返回真值对象时阻止关闭', async () => {
		const onBeforeClose = vi.fn(() => ({} as any));
		const wrapper = mount(NoticeView, {
			attachTo: document.body,
			props: { content: 'x', duration: 0, onBeforeClose }
		});
		await flush();

		await wrapper.find('.vc-notice__close').trigger('click');
		await flush();
		await Utils.sleep(400);
		await flush();

		expect(onBeforeClose).toHaveBeenCalledTimes(1);
		expect(isVisible(wrapper)).toBe(true);
		expect(wrapper.emitted('close')).toBeFalsy();

		wrapper.unmount();
	});

	it('已关闭状态下再次点击直接返回', async () => {
		const onBeforeClose = vi.fn(() => true);
		const wrapper = mount(NoticeView, {
			attachTo: document.body,
			props: { content: 'x', duration: 0, onBeforeClose }
		});
		await flush();

		const close = wrapper.find('.vc-notice__close');
		await close.trigger('click');
		await flushTransition();
		await close.trigger('click');
		await flush();

		expect(onBeforeClose).toHaveBeenCalledTimes(1);

		wrapper.unmount();
	}, 10000);

	it('duration>0: 到时自动关闭', async () => {
		const wrapper = mount(NoticeView, {
			attachTo: document.body,
			props: { content: 'x', duration: 30 }
		});
		await flush();

		expect(isVisible(wrapper)).toBe(true);
		await Utils.sleep(60);
		await flushTransition();
		expect(isVisible(wrapper)).toBe(false);

		wrapper.unmount();
	}, 10000);

	it('duration=0: 不自动关闭', async () => {
		const wrapper = mount(NoticeView, {
			attachTo: document.body,
			props: { content: 'x', duration: 0 }
		});
		await flush();

		await Utils.sleep(60);
		await flush();
		expect(isVisible(wrapper)).toBe(true);

		wrapper.unmount();
	});

	it('关闭后 (动画结束) 触发 close / portal-fulfilled', async () => {
		const wrapper = mount(NoticeView, {
			attachTo: document.body,
			props: { content: 'x', duration: 30 }
		});
		await flush();

		await Utils.sleep(60);
		await flushTransition();

		expect(wrapper.emitted('close')).toBeTruthy();
		expect(wrapper.emitted('portal-fulfilled')).toBeTruthy();

		wrapper.unmount();
	}, 10000);

	it('setDuration 重设时清理旧定时器', async () => {
		const wrapper = mount(NoticeView, {
			attachTo: document.body,
			props: { content: 'x', duration: 3000 }
		});
		await flush();

		expect(isVisible(wrapper)).toBe(true);
		(wrapper.vm as any).setDuration(30);
		await Utils.sleep(60);
		await flushTransition();
		expect(isVisible(wrapper)).toBe(false);

		wrapper.unmount();
	}, 10000);

	it('setDuration(0) 不设置定时器', async () => {
		const wrapper = mount(NoticeView, {
			attachTo: document.body,
			props: { content: 'x', duration: 0 }
		});
		await flush();

		(wrapper.vm as any).setDuration(0);
		await Utils.sleep(60);
		await flush();
		expect(isVisible(wrapper)).toBe(true);

		wrapper.unmount();
	});

	it('卸载时清理未触发的定时器', async () => {
		const wrapper = mount(NoticeView, {
			attachTo: document.body,
			props: { content: 'x', duration: 3000 }
		});
		await flush();

		expect(() => wrapper.unmount()).not.toThrow();
	});
});

describe('Notice 全局方法', () => {
	afterEach(async () => {
		Notice.destroy();
		await flush();
		document.body.innerHTML = '';
	});

	it('open: 在 body 中创建通知', async () => {
		Notice.open({ title: '全局标题', content: '全局内容', duration: 0 });
		await flush();

		expect(document.querySelector('.vc-notice')).not.toBeNull();
		expect(document.querySelector('.vc-notice__title')!.textContent).toContain('全局标题');
		expect(document.querySelector('.vc-notice__content')!.textContent).toContain('全局内容');
	});

	it('info/success/warning/error: 渲染对应图标', async () => {
		const cases: Array<['info' | 'success' | 'warning' | 'error', string]> = [
			['info', 'is-info'],
			['success', 'is-success'],
			['warning', 'is-warning'],
			['error', 'is-error']
		];

		for (const [mode, cls] of cases) {
			Notice[mode]({ content: mode, duration: 0 });
			await flush();
			expect(document.querySelector(`.vc-notice__icon.${cls}`)).not.toBeNull();
			Notice.destroy();
			await flush();
		}
	});

	it('自动关闭时触发 onClose 并清理容器', async () => {
		const onClose = vi.fn();
		Notice.open({ content: '自动关闭', duration: 30, onClose });
		await flush();
		expect(document.querySelector('.vc-notice')).not.toBeNull();

		await Utils.sleep(60);
		await flushTransition();

		expect(onClose).toHaveBeenCalledTimes(1);
		expect(document.querySelector('.vc-notice-portals')).toBeNull();
	}, 10000);

	it('destroy: 手动清理全部通知', async () => {
		Notice.info({ content: '待清理', duration: 0 });
		await flush();
		expect(document.querySelector('.vc-notice')).not.toBeNull();

		Notice.destroy();
		await flush();

		expect(document.querySelector('.vc-notice-portals')).toBeNull();
	});

	it('多个通知关闭其中一个时保留 portal 容器', async () => {
		Notice.open({ content: '先关闭', duration: 30 });
		Notice.open({ content: '保留', duration: 0 });
		await flush();

		expect(document.querySelector('.vc-notice-portals')).not.toBeNull();

		await Utils.sleep(60);
		await flushTransition();

		expect(document.querySelector('.vc-notice-portals')).not.toBeNull();
		expect(document.querySelectorAll('.vc-notice').length).toBe(1);
	}, 10000);

	it('open 支持 insertion 与 onBeforeClose', async () => {
		const onBeforeClose = vi.fn(() => true);
		Notice.open({
			content: '可关闭',
			duration: 0,
			insertion: 'last',
			onBeforeClose
		});
		await flush();

		const close = document.querySelector('.vc-notice__close') as HTMLElement;
		expect(close).not.toBeNull();
		close.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await flushTransition();

		expect(onBeforeClose).toHaveBeenCalledTimes(1);
	}, 10000);
});
