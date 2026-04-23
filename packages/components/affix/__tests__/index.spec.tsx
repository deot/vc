// @vitest-environment jsdom

import { Affix, ScrollerWheel } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { vi } from 'vitest';

const SLOT_TEXT = 'Affix content';

const mockRect = (el: Element, rect: Partial<DOMRect>) => {
	return vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
		width: 0,
		height: 0,
		x: 0,
		y: 0,
		toJSON: () => ({}),
		...rect
	} as DOMRect);
};

const triggerScroll = async () => {
	window.dispatchEvent(new Event('scroll'));
	await nextTick();
};

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Affix).toBe('object');
	});

	it('create', async () => {
		const wrapper = mount(() => (<Affix />));

		expect(wrapper.classes()).toContain('vc-affix');
	});

	it('render default slot', async () => {
		const wrapper = mount(() => (<Affix>{SLOT_TEXT}</Affix>), { attachTo: document.body });

		await nextTick();
		expect(wrapper.text()).toBe(SLOT_TEXT);
		wrapper.unmount();
	});

	it('slot receives active scope (initial false)', async () => {
		const wrapper = mount(
			() => (
				<Affix>
					{{
						default: ({ active }: { active: boolean }) => (
							<span class={active ? 'is-on' : 'is-off'}>{String(active)}</span>
						)
					}}
				</Affix>
			),
			{ attachTo: document.body }
		);

		await nextTick();
		expect(wrapper.find('.is-off').exists()).toBe(true);
		expect(wrapper.find('.is-on').exists()).toBe(false);
		wrapper.unmount();
	});

	it('disabled renders slot directly without wrapper', async () => {
		const wrapper = mount(() => (<Affix disabled>{SLOT_TEXT}</Affix>), { attachTo: document.body });

		await nextTick();
		expect(wrapper.find('.vc-affix').exists()).toBe(false);
		expect(wrapper.text()).toBe(SLOT_TEXT);
		wrapper.unmount();
	});

	it('activates on scroll (placement=top) and applies offset', async () => {
		const wrapper = mount(() => (<Affix offset={20}>{SLOT_TEXT}</Affix>), { attachTo: document.body });

		await nextTick();
		expect(wrapper.find('.vc-affix__fixed').exists()).toBe(false);

		const root = wrapper.find('.vc-affix').element;
		const spy = mockRect(root, { top: -100, bottom: -60, width: 200, height: 40 });

		await triggerScroll();

		const inner = wrapper.find('.vc-affix__fixed');
		expect(inner.exists()).toBe(true);
		expect(inner.attributes('style')).toContain('top: 20px');
		expect(inner.attributes('style')).toContain('width: 200px');
		expect(inner.attributes('style')).toContain('height: 40px');

		spy.mockRestore();
		wrapper.unmount();
	});

	it('activates on scroll (placement=bottom) and applies offset', async () => {
		const wrapper = mount(() => (
			<Affix placement="bottom" offset={30}>{SLOT_TEXT}</Affix>
		), { attachTo: document.body });

		await nextTick();

		const root = wrapper.find('.vc-affix').element;
		const spy = mockRect(root, { top: 9000, bottom: 99999, width: 200, height: 40 });

		await triggerScroll();

		const inner = wrapper.find('.vc-affix__fixed');
		expect(inner.exists()).toBe(true);
		expect(inner.attributes('style')).toContain('bottom: 30px');

		spy.mockRestore();
		wrapper.unmount();
	});

	it('applies zIndex style when active', async () => {
		const wrapper = mount(() => (<Affix zIndex={1000}>{SLOT_TEXT}</Affix>), { attachTo: document.body });

		await nextTick();

		const root = wrapper.find('.vc-affix').element;
		const spy = mockRect(root, { top: -100, bottom: -60, width: 200, height: 40 });

		await triggerScroll();

		expect(wrapper.find('.vc-affix__fixed').attributes('style')).toContain('z-index: 1000');

		spy.mockRestore();
		wrapper.unmount();
	});

	it('emits update:modelValue on refresh', async () => {
		const onUpdate = vi.fn();
		const wrapper = mount(Affix, {
			props: {
				'offset': 20,
				'onUpdate:modelValue': onUpdate
			},
			slots: {
				default: () => SLOT_TEXT
			},
			attachTo: document.body
		});

		await nextTick();
		expect(onUpdate).toHaveBeenCalled();
		onUpdate.mockClear();

		const root = wrapper.find('.vc-affix').element;
		const spy = mockRect(root, { top: -100, bottom: -60, width: 200, height: 40 });

		await triggerScroll();

		expect(onUpdate).toHaveBeenCalled();
		const last = onUpdate.mock.calls.at(-1);
		expect(last?.[0]).toBe(true);

		spy.mockRestore();
		wrapper.unmount();
	});

	it('exposes refresh / onScroll / offScroll methods', async () => {
		const wrapper = mount(Affix, { attachTo: document.body });

		await nextTick();
		const vm = wrapper.vm as any;
		expect(typeof vm.refresh).toBe('function');
		expect(typeof vm.onScroll).toBe('function');
		expect(typeof vm.offScroll).toBe('function');

		vm.refresh();

		const handler = vi.fn();
		const off = vm.onScroll(handler, { first: true });
		await nextTick();
		expect(handler).toHaveBeenCalled();
		off();
		vm.offScroll(handler);

		wrapper.unmount();
	});

	it('target prop scopes the fixed activation', async () => {
		const wrapper = mount(() => (
			<div class="affix-target" style="height: 200px">
				<Affix target=".affix-target" offset={10}>{SLOT_TEXT}</Affix>
			</div>
		), { attachTo: document.body });

		await nextTick();

		const root = wrapper.find('.vc-affix').element;
		const target = wrapper.find('.affix-target').element;

		const rootSpy = mockRect(root, { top: -50, bottom: -10, width: 200, height: 40 });
		const targetSpy = mockRect(target, { top: -60, bottom: 140, width: 200, height: 200 });
		await triggerScroll();
		expect(wrapper.find('.vc-affix__fixed').exists()).toBe(true);

		rootSpy.mockReturnValue({ top: -200, bottom: -160, width: 200, height: 40 } as DOMRect);
		targetSpy.mockReturnValue({ top: -400, bottom: -200, width: 200, height: 200 } as DOMRect);
		await triggerScroll();
		expect(wrapper.find('.vc-affix__fixed').exists()).toBe(false);

		rootSpy.mockRestore();
		targetSpy.mockRestore();
		wrapper.unmount();
	});

	it('target prop with placement=bottom', async () => {
		const wrapper = mount(() => (
			<div class="affix-target-bottom" style="height: 200px">
				<Affix target=".affix-target-bottom" placement="bottom" offset={10}>{SLOT_TEXT}</Affix>
			</div>
		), { attachTo: document.body });

		await nextTick();

		const root = wrapper.find('.vc-affix').element;
		const target = wrapper.find('.affix-target-bottom').element;

		const rootSpy = mockRect(root, { top: 9000, bottom: 99999, width: 200, height: 40 });
		const targetSpy = mockRect(target, { top: 0, bottom: 200, width: 200, height: 200 });
		await triggerScroll();

		expect(wrapper.find('.vc-affix__fixed').exists()).toBe(true);

		rootSpy.mockRestore();
		targetSpy.mockRestore();
		wrapper.unmount();
	});

	it('does nothing when disabled (no emit / no class switch)', async () => {
		const onUpdate = vi.fn();
		const wrapper = mount(Affix, {
			props: {
				'disabled': true,
				'onUpdate:modelValue': onUpdate
			},
			slots: {
				default: () => SLOT_TEXT
			},
			attachTo: document.body
		});

		await nextTick();
		await triggerScroll();

		expect(wrapper.find('.vc-affix').exists()).toBe(false);
		expect(onUpdate).not.toHaveBeenCalled();

		wrapper.unmount();
	});

	it('removes scroll listener on unmount', async () => {
		const removeSpy = vi.spyOn(window, 'removeEventListener');
		const wrapper = mount(() => (<Affix>{SLOT_TEXT}</Affix>), { attachTo: document.body });

		await nextTick();
		wrapper.unmount();

		expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
		removeSpy.mockRestore();
	});

	it('works inside ScrollerWheel (wheel path)', async () => {
		const scrollerRef = ref<any>();
		const wrapper = mount(() => (
			<ScrollerWheel
				ref={scrollerRef}
				height="200px"
				native={false}
			>
				<div style="height: 1000px">
					<Affix fixed={false} offset={10}>{SLOT_TEXT}</Affix>
				</div>
			</ScrollerWheel>
		), { attachTo: document.body });

		await nextTick();
		await nextTick();

		const scrollerEl = wrapper.find('.vc-scroller-wheel').element;
		const affixEl = wrapper.find('.vc-affix').element;

		// 模拟：Affix 顶部处于容器顶部之上，应激活
		const scrollerSpy = mockRect(scrollerEl, { top: 0, bottom: 200, width: 300, height: 200 });
		const affixSpy = mockRect(affixEl, { top: -50, bottom: -10, width: 200, height: 40 });

		// ScrollerWheel 暴露 scrollTo 方法，内部会触发订阅在 vc-scroller 上的 listeners（即 Affix 的 refresh）
		scrollerRef.value.scrollTo({ y: 50 });
		await nextTick();

		expect(wrapper.find('.vc-affix__absolute').exists()).toBe(true);

		// 反向：Affix 顶部在容器内且距顶部超过 offset，应取消激活
		affixSpy.mockReturnValue({
			top: 100,
			bottom: 140,
			left: 0,
			right: 200,
			width: 200,
			height: 40,
			x: 0,
			y: 100,
			toJSON: () => ({})
		} as DOMRect);

		scrollerRef.value.scrollTo({ y: 0 });
		await nextTick();

		expect(wrapper.find('.vc-affix__absolute').exists()).toBe(false);

		scrollerSpy.mockRestore();
		affixSpy.mockRestore();
		wrapper.unmount();
	});

	it('works inside ScrollerWheel (wheel path, placement=bottom)', async () => {
		const scrollerRef = ref<any>();
		const wrapper = mount(() => (
			<ScrollerWheel
				ref={scrollerRef}
				height="200px"
				native={false}
			>
				<div style="height: 1000px">
					<Affix fixed={false} placement="bottom" offset={10}>{SLOT_TEXT}</Affix>
				</div>
			</ScrollerWheel>
		), { attachTo: document.body });

		await nextTick();
		await nextTick();

		const scrollerEl = wrapper.find('.vc-scroller-wheel').element;
		const affixEl = wrapper.find('.vc-affix').element;

		// setAbsoluteStatus(bottom): isActive = currentRect.bottom - containerRect.top >= containerRect.height - offset
		// 容器 top=0, height=200, offset=10 → 激活条件 bottom >= 190
		const scrollerSpy = mockRect(scrollerEl, { top: 0, bottom: 200, width: 300, height: 200 });
		const affixSpy = mockRect(affixEl, { top: 160, bottom: 200, width: 200, height: 40 });

		scrollerRef.value.scrollTo({ y: 10 });
		await nextTick();

		expect(wrapper.find('.vc-affix__absolute').exists()).toBe(true);

		scrollerSpy.mockRestore();
		affixSpy.mockRestore();
		wrapper.unmount();
	});
});
