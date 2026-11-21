// @vitest-environment jsdom

import { MNavBar, NavBar, VcInstance } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick, ref, h } from 'vue';
import { vi } from 'vitest';

const progressOf = (wrapper: any) => (wrapper.element as HTMLElement).style.getPropertyValue('--vc-nav-bar-progress');

// jsdom 不计算布局：scrollTop 用实例属性代替
const createScroller = () => {
	const el = document.createElement('div');
	let top = 0;
	Object.defineProperty(el, 'scrollTop', { get: () => top, set: v => (top = v), configurable: true });
	const scrollTo = (v: number) => {
		top = v;
		el.dispatchEvent(new Event('scroll'));
	};
	return { el, scrollTo };
};

describe('nav-bar', () => {
	it('create', () => {
		expect(NavBar).toBe(MNavBar);

		const wrapper = mount(() => <MNavBar title="标题" />);
		expect(wrapper.classes()).toEqual(expect.arrayContaining(['vcm-nav-bar', 'is-border']));
		expect(wrapper.find('.vcm-nav-bar__title-text').text()).toBe('标题');
		expect(wrapper.find('.vcm-nav-bar__subtitle').exists()).toBe(false);
		// 默认只有箭头，读屏文字取 locale
		const back = wrapper.find('.vcm-nav-bar__back');
		expect(back.attributes('role')).toBe('button');
		expect(back.attributes('aria-label')).toBe('返回');
		expect(back.find('.vcm-nav-bar__back-icon').exists()).toBe(true);
		expect(back.find('.vcm-nav-bar__back-text').exists()).toBe(false);
		// 三列始终存在
		expect(wrapper.find('.vcm-nav-bar__left').exists()).toBe(true);
		expect(wrapper.find('.vcm-nav-bar__right').exists()).toBe(true);
	});

	it('back, backIcon, subtitle and right', async () => {
		const props = ref<Record<string, any>>({ back: '返回', subtitle: '副标题', right: '更多' });
		const wrapper = mount(() => <MNavBar title="标题" {...props.value} />);

		expect(wrapper.find('.vcm-nav-bar__back-text').text()).toBe('返回');
		expect(wrapper.find('.vcm-nav-bar__back').attributes('aria-label')).toBeUndefined();
		expect(wrapper.find('.vcm-nav-bar__subtitle').text()).toBe('副标题');
		expect(wrapper.find('.vcm-nav-bar__right').text()).toBe('更多');

		props.value = { back: '返回', backIcon: false };
		await nextTick();
		expect(wrapper.find('.vcm-nav-bar__back-icon').exists()).toBe(false);
		expect(wrapper.find('.vcm-nav-bar__back-text').text()).toBe('返回');

		props.value = { back: false };
		await nextTick();
		expect(wrapper.find('.vcm-nav-bar__back').exists()).toBe(false);

		props.value = { back: ({ progress }: any) => h('b', `p${progress}`) };
		await nextTick();
		expect(wrapper.find('.vcm-nav-bar__back-text b').text()).toBe('p1');
	});

	it('slots', () => {
		const wrapper = mount(() => (
			<MNavBar
				title="不显示"
				v-slots={{
					left: () => <span class="custom-left">关闭</span>,
					right: ({ progress }: any) => <span class="custom-right">{progress}</span>,
					back: () => <span class="custom-back">×</span>
				}}
			/>
		));
		expect(wrapper.find('.vcm-nav-bar__back .custom-back').exists()).toBe(true);
		expect(wrapper.find('.vcm-nav-bar__back').attributes('aria-label')).toBeUndefined();
		// #left 在返回区域之后
		const left = wrapper.find('.vcm-nav-bar__left').element;
		expect(left.lastElementChild!.className).toBe('custom-left');
		expect(wrapper.find('.custom-right').text()).toBe('1');

		const titled = mount(() => <MNavBar v-slots={{ title: () => '插槽标题', subtitle: () => '插槽副标题' }} />);
		expect(titled.find('.vcm-nav-bar__title-text').text()).toBe('插槽标题');
		expect(titled.find('.vcm-nav-bar__subtitle').text()).toBe('插槽副标题');

		// #default 替换整个中间区域
		const custom = mount(() => <MNavBar title="不显示" v-slots={{ default: () => <i class="tabs" /> }} />);
		expect(custom.classes()).toContain('is-custom');
		expect(custom.find('.vcm-nav-bar__title').exists()).toBe(false);
		expect(custom.find('.vcm-nav-bar__content .tabs').exists()).toBe(true);
	});

	it('back: listener, global hook, then history.back', async () => {
		const historyBack = vi.spyOn(window.history, 'back').mockImplementation(() => {});

		// 有监听：只发事件
		const onBack = vi.fn();
		const listened = mount(() => <MNavBar onBack={onBack} />);
		await listened.find('.vcm-nav-bar__back').trigger('click');
		expect(onBack).toHaveBeenCalledTimes(1);
		expect(historyBack).not.toHaveBeenCalled();

		// 键盘
		await listened.find('.vcm-nav-bar__back').trigger('keydown', { key: 'Enter' });
		await listened.find('.vcm-nav-bar__back').trigger('keydown', { key: 'a' });
		expect(onBack).toHaveBeenCalledTimes(2);

		// 没有监听：钩子接管
		const hook = vi.fn(() => true);
		VcInstance.configure({ MNavBar: { back: hook } });
		const hooked = mount(() => <MNavBar />);
		await hooked.find('.vcm-nav-bar__back').trigger('click');
		expect(hook).toHaveBeenCalledWith(expect.objectContaining({ instance: expect.anything() }));
		expect(historyBack).not.toHaveBeenCalled();

		// 钩子返回 undefined：回到上一页
		hook.mockImplementation(() => void 0 as any);
		await hooked.find('.vcm-nav-bar__back').trigger('click');
		expect(historyBack).toHaveBeenCalledTimes(1);

		VcInstance.configure({ MNavBar: undefined });
		await hooked.find('.vcm-nav-bar__back').trigger('click');
		expect(historyBack).toHaveBeenCalledTimes(2);

		historyBack.mockRestore();
	});

	it('fixed, placeholder, safeArea and zIndex', async () => {
		const props = ref<Record<string, any>>({});
		const wrapper = mount(() => <MNavBar {...props.value} />);
		expect(wrapper.classes()).not.toContain('is-fixed');
		expect(wrapper.classes()).not.toContain('is-safe-area');

		props.value = { fixed: true, zIndex: 20 };
		await nextTick();
		expect(wrapper.classes()).toEqual(expect.arrayContaining(['is-fixed', 'is-placeholder', 'is-safe-area']));
		expect((wrapper.find('.vcm-nav-bar__wrapper').element as HTMLElement).style.zIndex).toBe('20');

		props.value = { fixed: true, placeholder: false, safeArea: false, border: false };
		await nextTick();
		expect(wrapper.classes()).toContain('is-fixed');
		expect(wrapper.classes()).not.toContain('is-placeholder');
		expect(wrapper.classes()).not.toContain('is-safe-area');
		expect(wrapper.classes()).not.toContain('is-border');

		// 不 fixed 时 zIndex 不生效
		props.value = { zIndex: 20, safeArea: true };
		await nextTick();
		expect(wrapper.classes()).toContain('is-safe-area');
		expect((wrapper.find('.vcm-nav-bar__wrapper').element as HTMLElement).style.zIndex).toBe('');
	});

	it('transparent', async () => {
		const always = mount(() => <MNavBar transparent />);
		expect(always.classes()).toContain('is-transparent');
		expect(progressOf(always)).toBe('');

		// 数字：750 稿长度；jsdom 下 1 个单位为 0.5px，200 即 100px
		const { el, scrollTo } = createScroller();
		const right = vi.fn(({ progress }: any) => String(progress));
		const props = ref<Record<string, any>>({ transparent: 200, getScroller: () => el });
		const wrapper = mount(() => <MNavBar {...props.value} v-slots={{ right }} />, { attachTo: document.body });
		await nextTick();
		expect(wrapper.classes()).toContain('is-scroll-linked');
		expect(progressOf(wrapper)).toBe('0');

		scrollTo(50);
		await nextTick();
		expect(progressOf(wrapper)).toBe('0.5');
		expect(wrapper.find('.vcm-nav-bar__right').text()).toBe('0.5');

		scrollTo(400);
		await nextTick();
		expect(progressOf(wrapper)).toBe('1');

		// 同一档内滚动不重新渲染
		const calls = right.mock.calls.length;
		scrollTo(500);
		await nextTick();
		expect(right.mock.calls.length).toBe(calls);

		// 关闭后解除监听、去掉变量
		const remove = vi.spyOn(el, 'removeEventListener');
		props.value = { transparent: false, getScroller: () => el };
		await nextTick();
		expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
		expect(progressOf(wrapper)).toBe('');
		expect(wrapper.find('.vcm-nav-bar__right').text()).toBe('1');

		// 卸载时解除监听
		props.value = { transparent: 200, getScroller: () => el };
		await nextTick();
		remove.mockClear();
		wrapper.unmount();
		expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
	});

	it('transparent without getScroller falls back to window', async () => {
		const add = vi.spyOn(window, 'addEventListener');
		const wrapper = mount(() => <MNavBar transparent={100} />, { attachTo: document.body });
		await nextTick();
		expect(add).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
		add.mockRestore();
		wrapper.unmount();
	});
});
