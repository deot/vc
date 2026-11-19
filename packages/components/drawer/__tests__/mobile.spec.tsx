// @vitest-environment jsdom

import { MDrawer, MDrawerView } from '@deot/vc-components';
import { mount, config } from '@vue/test-utils';
import { Utils } from '@deot/dev-test';
import { nextTick, ref } from 'vue';
import { vi } from 'vitest';
import { fireTouch } from '../../../hooks/__tests__/fixtures/drag';

// 走真实 Transition 生命周期，onAfterLeave 才会触发
config.global.stubs.transition = false;
config.global.stubs['transition-group'] = false;

const flush = async (ms = 0) => {
	await nextTick();
	await Utils.sleep(ms);
	await nextTick();
};

// MPopup 离场 240ms，手势滑出 240ms
const flushLeave = () => flush(600);

const visibleWrapper = () => [...document.querySelectorAll<HTMLElement>('.vcm-drawer .vcm-popup__wrapper')]
	.find(el => el.style.display !== 'none');

// jsdom 不做布局：给面板一个尺寸
const sizeOf = (el: HTMLElement, width: number, height: number) => {
	Object.defineProperty(el, 'offsetWidth', { configurable: true, value: width });
	Object.defineProperty(el, 'offsetHeight', { configurable: true, value: height });
};

const swipe = (el: HTMLElement, from: [number, number], to: [number, number], steps = 4) => {
	fireTouch(el, 'touchstart', { clientX: from[0], clientY: from[1] });
	for (let i = 1; i <= steps; i++) {
		fireTouch(el, 'touchmove', {
			clientX: from[0] + (to[0] - from[0]) * i / steps,
			clientY: from[1] + (to[1] - from[1]) * i / steps
		});
	}
	fireTouch(el, 'touchend', { clientX: to[0], clientY: to[1] });
};

const mountDrawer = async (props: Record<string, any> = {}, slots: Record<string, any> = {}) => {
	const visible = ref(true);
	const onClose = vi.fn();
	const wrapper = mount(() => (
		<MDrawerView v-model={visible.value} onClose={onClose} {...props}>
			{{ default: () => <div class="body">x</div>, ...slots }}
		</MDrawerView>
	), { attachTo: document.body });
	await flush();
	return { wrapper, visible, onClose };
};

describe('MDrawer', () => {
	afterEach(() => {
		MDrawer.destroy();
		document.body.innerHTML = '';
		document.body.style.removeProperty('overflow');
	});

	it('basic', () => {
		expect(typeof MDrawer).toBe('object');
		expect(typeof MDrawerView).toBe('object');
		expect(typeof MDrawer.open).toBe('function');
		expect(typeof MDrawer.destroy).toBe('function');
	});

	it('基于 MPopup 渲染：根节点 vcm-popup vcm-drawer，标题栏带关闭按钮，底部两个 MButton', async () => {
		const { wrapper } = await mountDrawer({ title: 'title' });

		const root = wrapper.find('.vcm-drawer');
		expect(root.classes()).toContain('vcm-popup');
		expect(root.classes()).toContain('is-right');
		expect(wrapper.find('.vcm-popup__title').text()).toBe('title');
		expect(wrapper.find('.vcm-popup__close').exists()).toBe(true);

		const buttons = wrapper.findAll('.vcm-drawer__footer .vcm-button');
		expect(buttons.map(item => item.text())).toEqual(['取消', '确定']);
		expect(buttons[0].classes()).toContain('vcm-drawer__cancel');
		expect(buttons[1].classes()).toContain('vcm-drawer__ok');
		wrapper.unmount();
	});

	it('尺寸按 750 稿：左右默认宽 600；上下不设置时不写高度', async () => {
		const { wrapper } = await mountDrawer();
		expect(visibleWrapper()!.style.width).toBe('calc(var(--vc-rem) * 600)');
		wrapper.unmount();

		const bottom = await mountDrawer({ placement: 'bottom' });
		expect(visibleWrapper()!.style.height).toBe('');
		bottom.wrapper.unmount();

		const sized = await mountDrawer({ placement: 'top', height: 400, wrapperStyle: { color: 'red' } });
		expect(visibleWrapper()!.style.height).toBe('calc(var(--vc-rem) * 400)');
		expect(visibleWrapper()!.style.color).toBe('red');
		sized.wrapper.unmount();

		const css = await mountDrawer({ width: '50%', maskStyle: { opacity: '0.5' } });
		expect(visibleWrapper()!.style.width).toBe('50%');
		expect((document.querySelector('.vcm-drawer .vcm-popup__mask') as HTMLElement).style.opacity).toBe('0.5');
		css.wrapper.unmount();
	});

	it('确定：onOk 返回 Promise 时兑现后关闭，离场后发出 close / update:modelValue', async () => {
		let resolve: () => void;
		const onOk = vi.fn(() => new Promise<void>((r) => {
			resolve = r;
		}));
		const { wrapper, visible, onClose } = await mountDrawer({ onOk });

		await wrapper.find('.vcm-drawer__ok').trigger('click');
		await flushLeave();
		expect(onOk).toHaveBeenCalledTimes(1);
		expect(visible.value).toBe(true);

		resolve!();
		await flushLeave();
		expect(visible.value).toBe(false);
		expect(onClose).toHaveBeenCalledTimes(1);
		wrapper.unmount();
	});

	it('closeWithCancel：遮罩、关闭按钮经过 onCancel，返回其它真值时保持打开', async () => {
		const onCancel = vi.fn(() => 'keep');
		const { wrapper, visible } = await mountDrawer({ onCancel });

		await wrapper.find('.vcm-popup__mask').trigger('click');
		await wrapper.find('.vcm-popup__close').trigger('click');
		await flushLeave();
		expect(onCancel).toHaveBeenCalledTimes(2);
		expect(visible.value).toBe(true);

		onCancel.mockReturnValue(undefined as any);
		await wrapper.find('.vcm-popup__close').trigger('click');
		// 离场中再次点击不重复触发
		await wrapper.find('.vcm-popup__mask').trigger('click');
		await wrapper.find('.vcm-drawer__cancel').trigger('click');
		await flushLeave();
		expect(onCancel).toHaveBeenCalledTimes(3);
		expect(visible.value).toBe(false);
		wrapper.unmount();
	});

	it('closeWithCancel=false：遮罩直接关闭，不触发 onCancel；maskClosable=false 时遮罩不关闭', async () => {
		const onCancel = vi.fn();
		const { wrapper, visible } = await mountDrawer({ onCancel, closeWithCancel: false, maskClosable: false });

		await wrapper.find('.vcm-popup__mask').trigger('click');
		await flushLeave();
		expect(visible.value).toBe(true);

		await wrapper.find('.vcm-popup__close').trigger('click');
		await flushLeave();
		expect(onCancel).not.toHaveBeenCalled();
		expect(visible.value).toBe(false);
		wrapper.unmount();
	});

	it('滑动关闭经过 onCancel：Promise 拒绝时回弹，兑现后以离场动画关闭；之后可再次打开', async () => {
		let settle: { resolve: () => void; reject: () => void };
		const onCancel = vi.fn(() => new Promise<void>((resolve, reject) => {
			settle = { resolve, reject };
		}));
		const { wrapper, visible, onClose } = await mountDrawer({ onCancel });
		const panel = visibleWrapper()!;
		sizeOf(panel, 300, 812);

		swipe(panel, [50, 100], [290, 100]);
		expect(onCancel).toHaveBeenCalledTimes(1);
		// 不滑出：回到原位
		expect(panel.style.transform).toBe('translateX(0px)');
		settle!.reject();
		await flushLeave();
		expect(visible.value).toBe(true);

		swipe(panel, [50, 100], [290, 100]);
		settle!.resolve();
		await flushLeave();
		expect(onCancel).toHaveBeenCalledTimes(2);
		expect(visible.value).toBe(false);
		expect(onClose).toHaveBeenCalledTimes(1);

		visible.value = true;
		await flush();
		expect(visibleWrapper()).toBeTruthy();
		wrapper.unmount();
	});

	it('滑动关闭：onCancel 同步允许时从当前位置滑出', async () => {
		const onCancel = vi.fn();
		const { wrapper, visible } = await mountDrawer({ onCancel, placement: 'bottom' });
		const panel = visibleWrapper()!;
		sizeOf(panel, 375, 400);

		swipe(panel, [100, 100], [100, 300]);
		expect(panel.style.transform).toBe('translateY(400px)');
		await flushLeave();
		expect(onCancel).toHaveBeenCalledTimes(1);
		expect(visible.value).toBe(false);
		wrapper.unmount();
	});

	it('footer=false 或按钮文案都为假值时不渲染底部；插槽 header / footer / footer-extra', async () => {
		const hidden = await mountDrawer({ footer: false });
		expect(document.querySelector('.vcm-drawer__footer')).toBeNull();
		hidden.wrapper.unmount();

		const empty = await mountDrawer({ okText: false, cancelText: '' });
		expect(document.querySelector('.vcm-drawer__footer')).toBeNull();
		empty.wrapper.unmount();

		const { wrapper } = await mountDrawer({}, {
			'header': () => <span class="custom-header">header</span>,
			'footer': () => <span class="custom-footer">footer</span>,
			'footer-extra': () => <span class="custom-extra">extra</span>
		});
		expect(wrapper.find('.vcm-popup__title .custom-header').exists()).toBe(true);
		const footer = wrapper.find('.vcm-drawer__footer');
		expect(footer.find('.custom-extra').exists()).toBe(true);
		expect(footer.find('.custom-footer').exists()).toBe(true);
		expect(footer.find('.vcm-button').exists()).toBe(false);
		wrapper.unmount();
	});

	it('MDrawer.open：渲染到 body，确定后关闭并调用 onClose', async () => {
		const onOk = vi.fn();
		const onClose = vi.fn();
		MDrawer.open({ title: 'open-title', content: 'open-content', onOk, onClose });
		await flush();

		expect(document.querySelector('.vcm-drawer .vcm-popup__title')!.textContent).toBe('open-title');
		expect(document.querySelector('.vcm-drawer .vcm-popup__content')!.textContent).toContain('open-content');

		(document.querySelector('.vcm-drawer__ok') as HTMLElement).click();
		await flushLeave();
		expect(onOk).toHaveBeenCalledTimes(1);
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
