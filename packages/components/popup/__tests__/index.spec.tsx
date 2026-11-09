// @vitest-environment jsdom

import { Popup, MPopup } from '@deot/vc-components';
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

// 离场 240ms，手势滑出 240ms
const flushLeave = () => flush(600);

const visibleWrapper = () => [...document.querySelectorAll<HTMLElement>('.vcm-popup__wrapper')]
	.find(el => el.style.display !== 'none');

// jsdom 不做布局：给面板一个尺寸
const sizeOf = (el: HTMLElement, width: number, height: number) => {
	Object.defineProperty(el, 'offsetWidth', { configurable: true, value: width });
	Object.defineProperty(el, 'offsetHeight', { configurable: true, value: height });
};

// 一次拖动：start → 若干 move → end；返回各次 move 事件
const swipe = (el: HTMLElement, from: [number, number], to: [number, number], steps = 4) => {
	fireTouch(el, 'touchstart', { clientX: from[0], clientY: from[1] });
	const moves: TouchEvent[] = [];
	for (let i = 1; i <= steps; i++) {
		moves.push(fireTouch(el, 'touchmove', {
			clientX: from[0] + (to[0] - from[0]) * i / steps,
			clientY: from[1] + (to[1] - from[1]) * i / steps
		}));
	}
	fireTouch(el, 'touchend', { clientX: to[0], clientY: to[1] });
	return moves;
};

describe('index.ts', () => {
	afterEach(() => {
		vi.useRealTimers();
		document.body.innerHTML = '';
		document.body.style.removeProperty('overflow');
	});

	it('basic', () => {
		expect(typeof Popup).toBe('object');
		expect(Popup).toBe(MPopup);
		expect(typeof MPopup.open).toBe('function');
	});

	it('create', async () => {
		const wrapper = mount(() => (<Popup />));

		expect(wrapper.classes()).toContain('vcm-popup');
	});

	it('只有默认插槽时不加结构', async () => {
		const wrapper = mount(() => (<MPopup modelValue><span class="custom">内容</span></MPopup>), { attachTo: document.body });
		await flush();

		const panel = wrapper.find('.vcm-popup__wrapper');
		expect(panel.classes()).not.toContain('is-structured');
		expect(panel.element.firstElementChild!.classList.contains('custom')).toBe(true);
		expect(wrapper.find('.vcm-popup__header').exists()).toBe(false);
		wrapper.unmount();
	});

	it('title / content / closable / 插槽', async () => {
		const visible = ref(true);
		const wrapper = mount(() => (
			<MPopup
				v-model={visible.value}
				title="标题"
				content="内容"
				closable
				v-slots={{ default: () => <span class="slot">插槽</span>, footer: () => <span class="foot">底部</span> }}
			/>
		), { attachTo: document.body });
		await flush();

		expect(wrapper.find('.vcm-popup__wrapper').classes()).toContain('is-structured');
		expect(wrapper.find('.vcm-popup__title').text()).toBe('标题');
		// scrollable 默认 true：内容区在 MScroller 内，content 在默认插槽之前
		const content = wrapper.find('.vcm-popup__scroller .vcm-popup__content');
		expect(content.text()).toBe('内容插槽');
		expect(wrapper.find('.vcm-popup__footer .foot').exists()).toBe(true);

		await wrapper.find('.vcm-popup__close').trigger('click');
		await flushLeave();
		expect(visible.value).toBe(false);
		wrapper.unmount();
	});

	it('title 为 false 时不显示标题栏；scrollable 为 false 时内容区不滚动', async () => {
		const wrapper = mount(() => (<MPopup modelValue title={false} content="内容" scrollable={false} />), { attachTo: document.body });
		await flush();

		expect(wrapper.find('.vcm-popup__header').exists()).toBe(false);
		expect(wrapper.find('.vcm-popup__scroller').exists()).toBe(false);
		expect(wrapper.find('.vcm-popup__wrapper > .vcm-popup__content').text()).toBe('内容');
		wrapper.unmount();
	});

	it('visible-change：打开时 true，离场后 false', async () => {
		const visible = ref(false);
		const onVisibleChange = vi.fn();
		const wrapper = mount(() => (
			<MPopup v-model={visible.value} onVisibleChange={onVisibleChange}>x</MPopup>
		), { attachTo: document.body });
		await flush();

		visible.value = true;
		await flush();
		expect(onVisibleChange).toHaveBeenLastCalledWith(true);

		await wrapper.find('.vcm-popup__mask').trigger('click');
		await flushLeave();
		expect(onVisibleChange).toHaveBeenLastCalledWith(false);
		expect(onVisibleChange).toHaveBeenCalledTimes(2);
		wrapper.unmount();
	});

	it('placement 可在运行时切换', async () => {
		const placement = ref('bottom');
		const wrapper = mount(() => (<MPopup modelValue placement={placement.value as any}>x</MPopup>), { attachTo: document.body });
		await flush();
		expect(wrapper.classes()).toContain('is-bottom');

		placement.value = 'center';
		await flush();
		expect(wrapper.classes()).toContain('is-center');
		// center 使用淡入淡出
		expect(wrapper.findComponent({ name: 'vc-transition-fade' }).exists()).toBe(true);
		expect(wrapper.findComponent({ name: 'vc-transition-slide' }).exists()).toBe(false);
		wrapper.unmount();
	});

	it('打开期间锁定 body 滚动', async () => {
		const visible = ref(true);
		const wrapper = mount(() => (<MPopup v-model={visible.value}>x</MPopup>), { attachTo: document.body });
		await flush();
		expect(document.body.style.overflow).toBe('hidden');

		visible.value = false;
		await flush();
		expect(document.body.style.overflow).toBe('');
		wrapper.unmount();
	});

	describe('swipeClosable', () => {
		const mountSwipe = async (props: Record<string, any> = {}, slot?: () => any) => {
			const visible = ref(true);
			const onClose = vi.fn();
			const wrapper = mount(() => (
				<MPopup v-model={visible.value} onClose={onClose} {...props}>
					{slot ? slot() : <div class="body">x</div>}
				</MPopup>
			), { attachTo: document.body });
			await flush();
			const panel = visibleWrapper()!;
			sizeOf(panel, 375, 400);
			return { wrapper, visible, onClose, panel };
		};

		it('跟手：面板随拖动移动，遮罩变淡；不到阈值且慢速时回弹', async () => {
			const { wrapper, visible, panel } = await mountSwipe();
			const mask = wrapper.find('.vcm-popup__mask').element as HTMLElement;

			fireTouch(panel, 'touchstart', { clientX: 100, clientY: 100 });
			const move = fireTouch(panel, 'touchmove', { clientX: 100, clientY: 180 });
			expect(move.defaultPrevented).toBe(true);
			expect(panel.style.transform).toBe('translateY(80px)');
			expect(mask.style.opacity).toBe(`${1 - 80 / 400}`);

			// 慢速松手：80 / 400 = 0.2 < 0.3
			await Utils.sleep(600);
			fireTouch(panel, 'touchend', { clientX: 100, clientY: 180 });
			expect(panel.style.transform).toBe('translateY(0px)');
			await flushLeave();
			expect(visible.value).toBe(true);
			expect(panel.style.transform).toBe('');
			wrapper.unmount();
		});

		it('超过阈值时从当前位置滑出并关闭', async () => {
			const { wrapper, visible, onClose, panel } = await mountSwipe();

			swipe(panel, [100, 100], [100, 260]);
			expect(panel.style.transform).toBe('translateY(400px)');
			await flushLeave();
			expect(visible.value).toBe(false);
			expect(onClose).toHaveBeenCalledTimes(1);
			wrapper.unmount();
		});

		it('速度超过 speed 时关闭；距离太小不按速度关闭', async () => {
			const { wrapper, visible, panel } = await mountSwipe({ swipeClosable: { threshold: 0.9, speed: 200 } });

			// 抖动：8px，速度很快但距离不足
			swipe(panel, [100, 100], [100, 108]);
			await flushLeave();
			expect(visible.value).toBe(true);

			// 快速 60px
			swipe(panel, [100, 100], [100, 160]);
			await flushLeave();
			expect(visible.value).toBe(false);
			wrapper.unmount();
		});

		it('只响应允许的方向；directions 可指定多个', async () => {
			const { wrapper, visible, panel } = await mountSwipe({ swipeClosable: { directions: ['bottom', 'right'] } });

			// 上滑：不是允许的方向，只阻止穿透
			const [up] = swipe(panel, [100, 300], [100, 100]);
			expect(up.defaultPrevented).toBe(true);
			expect(panel.style.transform).toBe('');
			await flushLeave();
			expect(visible.value).toBe(true);

			// 右滑关闭
			swipe(panel, [50, 100], [300, 110]);
			await flushLeave();
			expect(visible.value).toBe(false);
			wrapper.unmount();
		});

		it('center 没有默认方向', async () => {
			const { wrapper, visible, panel } = await mountSwipe({ placement: 'center' });

			swipe(panel, [100, 100], [100, 300]);
			await flushLeave();
			expect(visible.value).toBe(true);
			wrapper.unmount();
		});

		it('内部滚动区域还能滚时交给滚动，滚到边界后由面板接管', async () => {
			const { wrapper, visible, panel } = await mountSwipe({}, () => (
				<div class="list" style="overflow-y: auto;"><div class="item">x</div></div>
			));
			const list = panel.querySelector<HTMLElement>('.list')!;
			const item = panel.querySelector<HTMLElement>('.item')!;
			Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 1000 });
			Object.defineProperty(list, 'clientHeight', { configurable: true, value: 300 });
			list.scrollTop = 100;

			// 已滚动：下拉交给滚动，不跟手、不阻止
			const moves = swipe(item, [100, 100], [100, 300]);
			expect(moves.some(e => e.defaultPrevented)).toBe(false);
			expect(panel.style.transform).toBe('');
			await flushLeave();
			expect(visible.value).toBe(true);

			// 在顶部：下拉由面板接管并关闭
			list.scrollTop = 0;
			swipe(item, [100, 100], [100, 300]);
			await flushLeave();
			expect(visible.value).toBe(false);
			wrapper.unmount();
		});

		it('内层组件已处理的手势（defaultPrevented）跳过', async () => {
			const { wrapper, visible, panel } = await mountSwipe({}, () => (
				<div class="inner" onTouchmove={(e: TouchEvent) => e.preventDefault()}>x</div>
			));
			const inner = panel.querySelector<HTMLElement>('.inner')!;

			swipe(inner, [100, 100], [100, 300]);
			expect(panel.style.transform).toBe('');
			await flushLeave();
			expect(visible.value).toBe(true);
			wrapper.unmount();
		});
	});

	it('swipeClosable 不设置时跟随 maskClosable；关闭时只阻止滚动穿透', async () => {
		const visible = ref(true);
		const maskClosable = ref(false);
		const swipeClosable = ref<boolean | undefined>(undefined);
		const wrapper = mount(() => (
			<MPopup v-model={visible.value} maskClosable={maskClosable.value} swipeClosable={swipeClosable.value}>
				<div class="body">x</div>
			</MPopup>
		), { attachTo: document.body });
		await flush();
		const body = wrapper.find('.body').element as HTMLElement;
		sizeOf(visibleWrapper()!, 375, 400);

		// maskClosable 为 false：滑动不关闭，只阻止滚动穿透
		const [move] = swipe(body, [100, 100], [100, 300]);
		expect(move.defaultPrevented).toBe(true);
		await flushLeave();
		expect(visible.value).toBe(true);

		// maskClosable 为 true 但 swipeClosable 为 false：同样不关闭
		maskClosable.value = true;
		swipeClosable.value = false;
		await nextTick();
		swipe(body, [100, 100], [100, 300]);
		await flushLeave();
		expect(visible.value).toBe(true);

		// swipeClosable 单独开启：即使 maskClosable 为 false 也可滑动关闭
		maskClosable.value = false;
		swipeClosable.value = true;
		await nextTick();
		swipe(body, [100, 100], [100, 300]);
		await flushLeave();
		expect(visible.value).toBe(false);

		// 关闭后不再拦截
		await flushLeave();
		const [after] = swipe(body, [100, 100], [100, 300]);
		expect(after.defaultPrevented).toBe(false);
		wrapper.unmount();
	});

	it('MPopup.open：Portal 打开，onClose 在离场后触发', async () => {
		const onClose = vi.fn();
		const leaf = MPopup.open({ title: '标题', content: '内容', closable: true, onClose });
		await flush();

		const panel = visibleWrapper()!;
		expect(panel.querySelector('.vcm-popup__title')!.textContent).toBe('标题');
		(panel.querySelector('.vcm-popup__close') as HTMLElement).click();
		await flushLeave();
		expect(onClose).toHaveBeenCalledTimes(1);
		leaf.destroy?.();
		MPopup.destroy();
	});
});
