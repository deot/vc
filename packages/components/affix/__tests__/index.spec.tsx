// @vitest-environment jsdom

import { Affix, Scroller, ScrollerWheel } from '@deot/vc-components';
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

	it('placement=bottom reads the live window height after it changes', async () => {
		const exposed = ref<any>();
		const wrapper = mount(() => (
			<Affix ref={exposed} placement="bottom">{SLOT_TEXT}</Affix>
		), { attachTo: document.body });

		await nextTick();

		const root = wrapper.find('.vc-affix').element;
		const original = Object.getOwnPropertyDescriptor(window, 'innerHeight');
		const setInnerHeight = (value: number) => {
			Object.defineProperty(window, 'innerHeight', { configurable: true, value });
		};

		// 挂载后窗口变矮：元素底部 700 落在新视口（600）之外，应吸底
		setInnerHeight(800);
		const spy = mockRect(root, { top: 660, bottom: 700, width: 200, height: 40 });
		exposed.value.refresh();
		await nextTick();
		expect(wrapper.find('.vc-affix__fixed').exists()).toBe(false);

		setInnerHeight(600);
		exposed.value.refresh();
		await nextTick();
		expect(wrapper.find('.vc-affix__fixed').exists()).toBe(true);

		spy.mockRestore();
		if (original) {
			Object.defineProperty(window, 'innerHeight', original);
		} else {
			delete (window as any).innerHeight;
		}
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

	const lastActive = (affix: any) => affix.emitted('update:modelValue')!.at(-1)![0];
	const withRect = (spy: any, el: Element, rect: Partial<DOMRect>) => spy.mockReturnValue({ ...el.getBoundingClientRect(), ...rect } as DOMRect);

	it('fixed=false pins with sticky inside ScrollerWheel (placement=top)', async () => {
		const scrollerRef = ref<any>();
		const wrapper = mount(() => (
			<ScrollerWheel ref={scrollerRef} height="200px" native={false}>
				<div style="height: 1000px">
					<Affix fixed={false} offset={10} zIndex={3}>{SLOT_TEXT}</Affix>
				</div>
			</ScrollerWheel>
		), { attachTo: document.body });

		await nextTick();
		await nextTick();

		const scrollerEl = wrapper.find('.vc-scroller-wheel').element as HTMLElement;
		const affix = wrapper.findComponent(Affix);
		const affixEl = affix.element as HTMLElement;

		// 吸附由 sticky 完成：偏移与层级在行内，不再使用占位和 absolute
		expect(affixEl.classList.contains('is-sticky')).toBe(true);
		expect(affixEl.style.top).toBe('10px');
		expect(affixEl.style.zIndex).toBe('3');
		expect(wrapper.find('.vc-affix__absolute').exists()).toBe(false);

		const scrollerSpy = mockRect(scrollerEl, { top: 0, bottom: 200, width: 300, height: 200 });
		const affixSpy = mockRect(affixEl, { top: 10, bottom: 50, width: 200, height: 40 });

		// 所在滚动容器即注入的 ScrollerWheel：通过实例的滚动通知同步刷新（与滚轮同一帧）
		scrollerRef.value.scrollTo({ y: 50 });
		expect(lastActive(affix)).toBe(true);
		expect(affixEl.style.width).toBe('');

		// 还没滚到吸附线
		withRect(affixSpy, affixEl, { top: 100, bottom: 140 });
		scrollerRef.value.scrollTo({ y: 0 });
		expect(lastActive(affix)).toBe(false);

		// 被父元素边界带走（越过吸附线）：不再算吸附中
		withRect(affixSpy, affixEl, { top: -20, bottom: 20 });
		scrollerRef.value.scrollTo({ y: 300 });
		expect(lastActive(affix)).toBe(false);

		scrollerSpy.mockRestore();
		affixSpy.mockRestore();
		wrapper.unmount();
	});

	it('fixed=false pins with sticky inside ScrollerWheel (placement=bottom)', async () => {
		const scrollerRef = ref<any>();
		const wrapper = mount(() => (
			<ScrollerWheel ref={scrollerRef} height="200px" native={false}>
				<div style="height: 1000px">
					<Affix fixed={false} placement="bottom" offset={10}>{SLOT_TEXT}</Affix>
				</div>
			</ScrollerWheel>
		), { attachTo: document.body });

		await nextTick();
		await nextTick();

		const scrollerEl = wrapper.find('.vc-scroller-wheel').element as HTMLElement;
		const affix = wrapper.findComponent(Affix);
		const affixEl = affix.element as HTMLElement;
		expect(affixEl.style.bottom).toBe('10px');
		expect(affixEl.style.top).toBe('');

		// 吸附线 = 可视区底（clientHeight）- offset = 190
		Object.defineProperty(scrollerEl, 'clientHeight', { configurable: true, get: () => 200 });
		const scrollerSpy = mockRect(scrollerEl, { top: 0, bottom: 200, width: 300, height: 200 });
		const affixSpy = mockRect(affixEl, { top: 150, bottom: 190, width: 200, height: 40 });

		scrollerRef.value.scrollTo({ y: 10 });
		expect(lastActive(affix)).toBe(true);

		withRect(affixSpy, affixEl, { top: 100, bottom: 140 });
		scrollerRef.value.scrollTo({ y: 20 });
		expect(lastActive(affix)).toBe(false);

		scrollerSpy.mockRestore();
		affixSpy.mockRestore();
		delete (scrollerEl as any).clientHeight;
		wrapper.unmount();
	});

	it('fixed=false in Scroller: native scroll and scrollTo both refresh via the injected instance', async () => {
		const scrollerRef = ref<any>();
		const wrapper = mount(() => (
			<Scroller ref={scrollerRef} height="200px" native={false}>
				<div style="height: 1000px">
					<Affix fixed={false} offset={10}>{SLOT_TEXT}</Affix>
				</div>
			</Scroller>
		), { attachTo: document.body });

		await nextTick();
		await nextTick();

		const scrollerEl = scrollerRef.value.wrapper as HTMLElement;
		const affix = wrapper.findComponent(Affix);
		const affixEl = affix.element as HTMLElement;
		const onSpy = vi.spyOn(scrollerRef.value, 'on');
		const scrollerSpy = mockRect(scrollerEl, { top: 0, bottom: 200, width: 300, height: 200 });
		const affixSpy = mockRect(affixEl, { top: 10, bottom: 50, width: 200, height: 40 });

		// 原生滚动：Scroller 的 scroll 处理会通知已订阅的 Affix
		scrollerEl.dispatchEvent(new Event('scroll'));
		expect(lastActive(affix)).toBe(true);

		withRect(affixSpy, affixEl, { top: 100, bottom: 140 });
		scrollerRef.value.setScrollTop(0);
		expect(lastActive(affix)).toBe(false);

		onSpy.mockRestore();
		scrollerSpy.mockRestore();
		affixSpy.mockRestore();
		wrapper.unmount();
	});

	it('fixed=false listens to the native scroll of an inner scroll container', async () => {
		const scrollerRef = ref<any>();
		const innerRef = ref<HTMLElement>();
		const wrapper = mount(() => (
			<Scroller ref={scrollerRef} height="400px" native={false}>
				<div ref={innerRef} style="height: 200px; overflow: auto">
					<div style="height: 1000px">
						<Affix fixed={false} offset={10}>{SLOT_TEXT}</Affix>
					</div>
				</div>
			</Scroller>
		), { attachTo: document.body });

		await nextTick();
		await nextTick();

		const inner = innerRef.value!;
		const affix = wrapper.findComponent(Affix);
		const affixEl = affix.element as HTMLElement;
		const innerSpy = mockRect(inner, { top: 50, bottom: 250, width: 300, height: 200 });
		const affixSpy = mockRect(affixEl, { top: 60, bottom: 100, width: 200, height: 40 });

		// 注入的是外层 Scroller，Affix 实际处在内层滚动容器中：改为监听内层的原生 scroll
		inner.dispatchEvent(new Event('scroll'));
		await nextTick();
		expect(lastActive(affix)).toBe(true);

		// 外层 Scroller 的滚动通知不再驱动它
		const count = affix.emitted('update:modelValue')!.length;
		scrollerRef.value.setScrollTop(10);
		expect(affix.emitted('update:modelValue')!.length).toBe(count);

		innerSpy.mockRestore();
		affixSpy.mockRestore();
		wrapper.unmount();
	});

	it('fixed=false at page level pins against the window', async () => {
		const wrapper = mount(() => (
			<div style="height: 3000px">
				<Affix fixed={false} offset={10}>{SLOT_TEXT}</Affix>
			</div>
		), { attachTo: document.body });

		await nextTick();
		await nextTick();

		const affix = wrapper.findComponent(Affix);
		const affixEl = affix.element as HTMLElement;
		expect(affixEl.classList.contains('is-sticky')).toBe(true);
		const affixSpy = mockRect(affixEl, { top: 10, bottom: 50, width: 200, height: 40 });

		await triggerScroll();
		expect(lastActive(affix)).toBe(true);

		withRect(affixSpy, affixEl, { top: 300, bottom: 340 });
		await triggerScroll();
		expect(lastActive(affix)).toBe(false);

		affixSpy.mockRestore();
		wrapper.unmount();
	});

	it('fixed=false pin line accounts for the scroll container padding', async () => {
		const scrollerRef = ref<any>();
		const wrapper = mount(() => (
			<Scroller ref={scrollerRef} height="200px" native={false} wrapperStyle={{ paddingTop: '20px' }}>
				<div style="height: 1000px">
					<Affix fixed={false} offset={10}>{SLOT_TEXT}</Affix>
				</div>
			</Scroller>
		), { attachTo: document.body });

		await nextTick();
		await nextTick();

		const scrollerEl = scrollerRef.value.wrapper as HTMLElement;
		const affix = wrapper.findComponent(Affix);
		const affixEl = affix.element as HTMLElement;
		const scrollerSpy = mockRect(scrollerEl, { top: 0, bottom: 220, width: 300, height: 220 });
		// sticky 参照去掉 padding 的可视区：吸附线 = 0 + 20 + 10
		const affixSpy = mockRect(affixEl, { top: 30, bottom: 70, width: 200, height: 40 });

		scrollerRef.value.setScrollTop(100);
		expect(lastActive(affix)).toBe(true);

		withRect(affixSpy, affixEl, { top: 10, bottom: 50 });
		scrollerRef.value.setScrollTop(120);
		expect(lastActive(affix)).toBe(false);

		scrollerSpy.mockRestore();
		affixSpy.mockRestore();
		wrapper.unmount();
	});

	it('fixed=false pin line scales with an ancestor transform', async () => {
		const scrollerRef = ref<any>();
		const wrapper = mount(() => (
			<Scroller ref={scrollerRef} height="200px" native={false}>
				<div style="height: 1000px">
					<Affix fixed={false} offset={10}>{SLOT_TEXT}</Affix>
				</div>
			</Scroller>
		), { attachTo: document.body });

		await nextTick();
		await nextTick();

		const scrollerEl = scrollerRef.value.wrapper as HTMLElement;
		const affix = wrapper.findComponent(Affix);
		const affixEl = affix.element as HTMLElement;
		// transform: scale(0.5)：布局高 200，视口中高 100；offset 10 在视口中为 5
		Object.defineProperty(scrollerEl, 'offsetHeight', { configurable: true, get: () => 200 });
		const scrollerSpy = mockRect(scrollerEl, { top: 0, bottom: 100, width: 150, height: 100 });
		const affixSpy = mockRect(affixEl, { top: 5, bottom: 25, width: 100, height: 20 });

		scrollerRef.value.setScrollTop(100);
		expect(lastActive(affix)).toBe(true);

		withRect(affixSpy, affixEl, { top: 10, bottom: 30 });
		scrollerRef.value.setScrollTop(110);
		expect(lastActive(affix)).toBe(false);

		scrollerSpy.mockRestore();
		affixSpy.mockRestore();
		delete (scrollerEl as any).offsetHeight;
		wrapper.unmount();
	});
});
