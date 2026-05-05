// @vitest-environment jsdom

import { Scroller, ScrollerWheel } from '@deot/vc-components';
import { getScroller, isWheel } from '../utils';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { vi } from 'vitest';

const sleep = (time = 0) => new Promise(resolve => setTimeout(resolve, time));

const defineGetter = (
	obj: any,
	prop: string,
	value: any
) => {
	const old = Object.getOwnPropertyDescriptor(obj, prop);
	Object.defineProperty(obj, prop, {
		configurable: true,
		get: () => value
	});
	return () => {
		if (old) {
			Object.defineProperty(obj, prop, old);
		} else {
			delete obj[prop];
		}
	};
};

const mockSize = (
	el: any,
	{ clientWidth, clientHeight, scrollWidth, scrollHeight }: {
		clientWidth?: number;
		clientHeight?: number;
		scrollWidth?: number;
		scrollHeight?: number;
	}
) => {
	const restores: Array<() => void> = [];
	if (typeof clientWidth === 'number') restores.push(defineGetter(el, 'clientWidth', clientWidth));
	if (typeof clientHeight === 'number') restores.push(defineGetter(el, 'clientHeight', clientHeight));
	if (typeof scrollWidth === 'number') restores.push(defineGetter(el, 'scrollWidth', scrollWidth));
	if (typeof scrollHeight === 'number') restores.push(defineGetter(el, 'scrollHeight', scrollHeight));
	return () => restores.forEach(fn => fn());
};

const makeScroll = async (
	dom: Element,
	name: 'scrollTop' | 'scrollLeft',
	offset: number
) => {
	(dom as any)[name] = offset;
	const evt = new CustomEvent('scroll', {
		detail: { target: { [name]: offset } }
	});
	dom.dispatchEvent(evt);
	return sleep();
};

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Scroller).toBe('object');
		expect(typeof ScrollerWheel).toBe('object');
	});

	it('create', async () => {
		const wrapper = mount(() => (<Scroller />));
		expect(wrapper.classes()).toContain('vc-scroller');
	});

	describe('Scroller', () => {
		it('renders structure with wrapper / content classes', async () => {
			const wrapper = mount(() => (<Scroller>content</Scroller>), { attachTo: document.body });
			await nextTick();

			expect(wrapper.find('.vc-scroller').exists()).toBe(true);
			expect(wrapper.find('.vc-scroller__wrapper').exists()).toBe(true);
			expect(wrapper.find('.vc-scroller__content').exists()).toBe(true);

			wrapper.unmount();
		});

		it('renders height props on wrapper', () => {
			const wrapper = mount(() => (
				<Scroller height="200px">
					<div style="height: 500px"></div>
				</Scroller>
			));

			expect(wrapper.find('.vc-scroller__wrapper').attributes('style')).toContain('height: 200px');
		});

		it('renders max-height props on wrapper (number prop)', () => {
			const wrapper = mount(() => (
				<Scroller maxHeight={300}>
					<div style="height: 500px"></div>
				</Scroller>
			));

			expect(wrapper.find('.vc-scroller__wrapper').attributes('style')).toContain('max-height: 300px');
		});

		it('passes wrapperStyle / wrapperClass through', () => {
			const wrapper = mount(() => (
				<Scroller
					wrapperStyle="background: red"
					wrapperClass="my-wrapper"
				/>
			));

			const wrap = wrapper.find('.vc-scroller__wrapper');
			expect(wrap.classes()).toContain('my-wrapper');
			expect(wrap.attributes('style')).toContain('background: red');
		});

		it('passes contentStyle / contentClass through', () => {
			const wrapper = mount(() => (
				<Scroller
					contentStyle="color: blue"
					contentClass="my-content"
				/>
			));

			const content = wrapper.find('.vc-scroller__content');
			expect(content.classes()).toContain('my-content');
			expect(content.attributes('style')).toContain('color: blue');
		});

		it('renders custom tag', () => {
			const wrapper = mount(() => (<Scroller tag="ul">x</Scroller>));

			expect(
				wrapper.find('.vc-scroller__content').element instanceof HTMLUListElement
			).toBe(true);
		});

		it('applies is-native / is-hidden class based on native prop', () => {
			const w1 = mount(() => (<Scroller native={true} />));
			expect(w1.find('.vc-scroller__wrapper').classes()).toContain('is-native');

			const w2 = mount(() => (<Scroller native={false} />));
			expect(w2.find('.vc-scroller__wrapper').classes()).toContain('is-hidden');
		});

		it('does not render Bar when showBar=false', async () => {
			const wrapper = mount(() => (
				<Scroller native={false} showBar={false} always height="100px">
					<div style="height: 500px"></div>
				</Scroller>
			), { attachTo: document.body });

			await nextTick();
			await nextTick();
			expect(wrapper.find('.vc-scroller-track').exists()).toBe(false);

			wrapper.unmount();
		});

		it('renders track when content overflows + always', async () => {
			const outerHeight = 200;
			const innerHeight = 500;
			const scrollerRef = ref<any>();
			const wrapper = mount(() => (
				<Scroller ref={scrollerRef} native={false} always height={`${outerHeight}px`}>
					<div style={`height: ${innerHeight}px;`}></div>
				</Scroller>
			), { attachTo: document.body });

			const wrapEl = wrapper.find('.vc-scroller__wrapper').element;
			const restore = mockSize(wrapEl, {
				clientWidth: 200,
				clientHeight: outerHeight,
				scrollWidth: 200,
				scrollHeight: innerHeight
			});

			await scrollerRef.value.refresh();
			await nextTick();

			expect(wrapper.find('.vc-scroller-track.is-vertical').exists()).toBe(true);
			// 内容更高，纵向有 thumb，always 下应可见
			expect(wrapper.find('.vc-scroller-track.is-vertical').attributes('style') ?? '')
				.not.toContain('display: none');
			// 水平方向无溢出，thumbSize 为 0，整个 track 通过 v-show 隐藏
			expect(wrapper.find('.vc-scroller-track.is-horizontal').attributes('style') ?? '')
				.toContain('display: none');

			restore();
			wrapper.unmount();
		});

		it('renders trackOffsetX / trackOffsetY in track style', async () => {
			const wrapper = mount(() => (
				<Scroller
					native={false}
					always
					height="200px"
					trackOffsetX={[0, 5, 6, 7]}
					trackOffsetY={[8, 9, 10, 11]}
				>
					<div style="height: 1000px; width: 1000px"></div>
				</Scroller>
			), { attachTo: document.body });

			const wrapEl = wrapper.find('.vc-scroller__wrapper').element;
			const restore = mockSize(wrapEl, {
				clientWidth: 200,
				clientHeight: 200,
				scrollWidth: 1000,
				scrollHeight: 1000
			});

			await makeScroll(wrapEl, 'scrollTop', 0);
			await nextTick();

			const verticalStyle = wrapper.find('.vc-scroller-track.is-vertical').attributes('style') ?? '';
			expect(verticalStyle).toContain('top: 8px');
			expect(verticalStyle).toContain('right: 9px');

			const horizontalStyle = wrapper.find('.vc-scroller-track.is-horizontal').attributes('style') ?? '';
			expect(horizontalStyle).toContain('left: 7px');
			expect(horizontalStyle).toContain('bottom: 6px');

			restore();
			wrapper.unmount();
		});

		it('barTo teleports the track to the target selector', async () => {
			const target = document.createElement('div');
			target.className = 'bar-to-target';
			document.body.appendChild(target);

			const wrapper = mount(() => (
				<Scroller native={false} always height="200px" barTo=".bar-to-target">
					<div style="height: 1000px"></div>
				</Scroller>
			), { attachTo: document.body });

			const wrapEl = wrapper.find('.vc-scroller__wrapper').element;
			const restore = mockSize(wrapEl, {
				clientHeight: 200,
				scrollHeight: 1000
			});

			await makeScroll(wrapEl, 'scrollTop', 0);
			await nextTick();
			await nextTick();

			expect(target.querySelector('.vc-scroller-track')).toBeTruthy();

			restore();
			wrapper.unmount();
			target.parentNode?.removeChild(target);
		});

		it('does not render Bar when barTo selector is missing', async () => {
			const wrapper = mount(() => (
				<Scroller native={false} always height="200px" barTo=".does-not-exist">
					<div style="height: 1000px"></div>
				</Scroller>
			), { attachTo: document.body });

			await nextTick();
			await nextTick();

			expect(wrapper.find('.vc-scroller-track').exists()).toBe(false);

			wrapper.unmount();
		});

		it('emits scroll event with delegate target on wrapper scroll', async () => {
			const onScroll = vi.fn();
			const scrollerRef = ref<any>();
			const wrapper = mount(() => (
				<Scroller ref={scrollerRef} native={false} height="200px" onScroll={onScroll}>
					<div style="height: 1000px"></div>
				</Scroller>
			), { attachTo: document.body });

			const wrapEl = wrapper.find('.vc-scroller__wrapper').element as HTMLElement;
			const restore = mockSize(wrapEl, {
				clientWidth: 200,
				clientHeight: 200,
				scrollWidth: 200,
				scrollHeight: 1000
			});

			await scrollerRef.value.refresh();
			await nextTick();

			await makeScroll(wrapEl, 'scrollTop', 100);

			expect(onScroll).toHaveBeenCalled();
			const evt = onScroll.mock.calls[0][0];
			expect(evt.target.scrollTop).toBe(100);
			expect(evt.target.clientHeight).toBe(200);
			expect(evt.target.scrollHeight).toBe(1000);

			restore();
			wrapper.unmount();
		});

		it('exposes setScrollTop / setScrollLeft / scrollTo / on / off / refresh', async () => {
			const wrapper = mount(Scroller, {
				props: { native: false, height: '200px' },
				slots: {
					default: () => <div style="height: 1000px; width: 1000px"></div>
				},
				attachTo: document.body
			});
			await nextTick();

			const vm = wrapper.vm as any;
			expect(typeof vm.setScrollTop).toBe('function');
			expect(typeof vm.setScrollLeft).toBe('function');
			expect(typeof vm.scrollTo).toBe('function');
			expect(typeof vm.refresh).toBe('function');
			expect(typeof vm.on).toBe('function');
			expect(typeof vm.off).toBe('function');

			const wrapEl = wrapper.find('.vc-scroller__wrapper').element as HTMLElement;
			const restore = mockSize(wrapEl, {
				clientWidth: 200,
				clientHeight: 200,
				scrollWidth: 1000,
				scrollHeight: 1000
			});

			vm.setScrollTop(120);
			expect(wrapEl.scrollTop).toBe(120);
			expect(vm.scrollTop).toBe(120);

			vm.setScrollLeft(80);
			expect(wrapEl.scrollLeft).toBe(80);
			expect(vm.scrollLeft).toBe(80);

			vm.scrollTo({ x: 30, y: 60 });
			expect(wrapEl.scrollTop).toBe(60);
			expect(wrapEl.scrollLeft).toBe(30);

			await vm.refresh();

			restore();
			wrapper.unmount();
		});

		it('on / off subscribes / unsubscribes scroll listeners', async () => {
			const wrapper = mount(Scroller, {
				props: { native: false, height: '200px' },
				slots: { default: () => <div style="height: 1000px"></div> },
				attachTo: document.body
			});
			await nextTick();

			const vm = wrapper.vm as any;
			const handler = vi.fn();
			vm.on(handler);

			vm.setScrollTop(50);
			expect(handler).toHaveBeenCalledTimes(1);
			expect(handler.mock.calls[0][0].target.scrollTop).toBe(50);

			vm.off(handler);
			vm.setScrollTop(100);
			expect(handler).toHaveBeenCalledTimes(1);

			wrapper.unmount();
		});

		it('thumb mousedown stops event propagation', async () => {
			const onParentClick = vi.fn();
			const wrapper = mount(() => (
				<div onClick={onParentClick}>
					<Scroller native={false} always height="200px">
						<div style="height: 1000px"></div>
					</Scroller>
				</div>
			), { attachTo: document.body });

			const wrapEl = wrapper.find('.vc-scroller__wrapper').element;
			const restore = mockSize(wrapEl, {
				clientHeight: 200,
				scrollHeight: 1000
			});

			await makeScroll(wrapEl, 'scrollTop', 0);
			await nextTick();

			const thumb = wrapper.find('.vc-scroller-track__thumb');
			expect(thumb.exists()).toBe(true);
			await thumb.trigger('mousedown');

			expect(onParentClick).not.toHaveBeenCalled();

			restore();
			wrapper.unmount();
		});
	});

	describe('ScrollerWheel', () => {
		it('renders root with vc-scroller-wheel + vc-scroller__wrapper classes', async () => {
			const wrapper = mount(() => (<ScrollerWheel>x</ScrollerWheel>), { attachTo: document.body });
			await nextTick();

			expect(wrapper.classes()).toContain('vc-scroller-wheel');
			expect(wrapper.classes()).toContain('vc-scroller__wrapper');
			expect(wrapper.find('.vc-scroller__content').exists()).toBe(true);

			wrapper.unmount();
		});

		it('renders height / max-height props on wrapper', () => {
			const w1 = mount(() => (<ScrollerWheel height="240px" />));
			expect(w1.attributes('style')).toContain('height: 240px');

			const w2 = mount(() => (<ScrollerWheel maxHeight="160px" />));
			expect(w2.attributes('style')).toContain('max-height: 160px');
		});

		it('applies is-native class when native=true', () => {
			const wrapper = mount(() => (<ScrollerWheel native={true} />));
			expect(wrapper.classes()).toContain('is-native');
		});

		it('does not render Bar when showBar=false', async () => {
			const wrapper = mount(() => (
				<ScrollerWheel native={false} showBar={false} always height="100px">
					<div style="height: 500px"></div>
				</ScrollerWheel>
			), { attachTo: document.body });
			await nextTick();
			await nextTick();

			expect(wrapper.find('.vc-scroller-track').exists()).toBe(false);
			wrapper.unmount();
		});

		it('emits scroll on native scroll', async () => {
			const onScroll = vi.fn();
			const wrapper = mount(() => (
				<ScrollerWheel native={true} height="200px" onScroll={onScroll}>
					<div style="height: 1000px"></div>
				</ScrollerWheel>
			), { attachTo: document.body });
			await nextTick();

			const wrapEl = wrapper.element as HTMLElement;
			const restore = mockSize(wrapEl, {
				clientHeight: 200,
				scrollHeight: 1000
			});

			await makeScroll(wrapEl, 'scrollTop', 50);
			expect(onScroll).toHaveBeenCalled();
			expect(onScroll.mock.calls[0][0].target.scrollTop).toBe(50);

			restore();
			wrapper.unmount();
		});

		it('does NOT emit scroll on native scroll when native=false', async () => {
			const onScroll = vi.fn();
			const wrapper = mount(() => (
				<ScrollerWheel native={false} height="200px" onScroll={onScroll}>
					<div style="height: 1000px"></div>
				</ScrollerWheel>
			), { attachTo: document.body });
			await nextTick();

			const wrapEl = wrapper.element as HTMLElement;
			await makeScroll(wrapEl, 'scrollTop', 50);

			expect(onScroll).not.toHaveBeenCalled();

			wrapper.unmount();
		});

		it('exposes scrollTo / setScrollTop / setScrollLeft / on / off', async () => {
			const scrollerRef = ref<any>();
			const onScroll = vi.fn();
			mount(() => (
				<ScrollerWheel
					ref={scrollerRef}
					native={false}
					height="200px"
					onScroll={onScroll}
				>
					<div style="height: 1000px; width: 1000px"></div>
				</ScrollerWheel>
			), { attachTo: document.body });

			await nextTick();

			const exposed = scrollerRef.value;
			expect(typeof exposed.scrollTo).toBe('function');
			expect(typeof exposed.setScrollTop).toBe('function');
			expect(typeof exposed.setScrollLeft).toBe('function');
			expect(typeof exposed.on).toBe('function');
			expect(typeof exposed.off).toBe('function');

			const handler = vi.fn();
			exposed.on(handler);

			exposed.scrollTo({ x: 10, y: 20 });
			expect(onScroll).toHaveBeenCalledTimes(1);
			expect(handler).toHaveBeenCalledTimes(1);
			expect(handler.mock.calls[0][0].target.scrollTop).toBe(20);
			expect(handler.mock.calls[0][0].target.scrollLeft).toBe(10);

			exposed.off(handler);
			exposed.setScrollTop(100);
			expect(handler).toHaveBeenCalledTimes(1);
			expect(onScroll).toHaveBeenCalledTimes(2);
		});

		it('cleans up wheel listener without throwing on unmount', async () => {
			const wrapper = mount(() => (
				<ScrollerWheel native={false} height="200px">
					<div style="height: 1000px"></div>
				</ScrollerWheel>
			), { attachTo: document.body });

			await nextTick();
			expect(() => wrapper.unmount()).not.toThrow();
		});

		it('wheel event triggers scroll on Y axis', async () => {
			const onScroll = vi.fn();
			const scrollerRef = ref<any>();
			const wrapper = mount(() => (
				<ScrollerWheel
					ref={scrollerRef}
					native={false}
					height="200px"
					onScroll={onScroll}
				>
					<div style="height: 1000px"></div>
				</ScrollerWheel>
			), { attachTo: document.body });
			await nextTick();

			const wrapEl = wrapper.element as HTMLElement;
			const restore = mockSize(wrapEl, {
				clientWidth: 200,
				clientHeight: 200,
				scrollWidth: 200,
				scrollHeight: 1000
			});

			await scrollerRef.value.refresh();
			await nextTick();

			wrapEl.dispatchEvent(new WheelEvent('wheel', {
				deltaY: 100,
				deltaX: 0,
				deltaMode: 0,
				bubbles: true,
				cancelable: true
			}));

			await sleep(30);

			expect(onScroll).toHaveBeenCalled();
			expect(scrollerRef.value.scrollTop).toBeGreaterThan(0);

			restore();
			wrapper.unmount();
		});

		it('wheel event triggers scroll on X axis', async () => {
			const onScroll = vi.fn();
			const scrollerRef = ref<any>();
			const wrapper = mount(() => (
				<ScrollerWheel
					ref={scrollerRef}
					native={false}
					height="200px"
					stopPropagation={false}
					onScroll={onScroll}
				>
					<div style="height: 200px; width: 1000px"></div>
				</ScrollerWheel>
			), { attachTo: document.body });
			await nextTick();

			const wrapEl = wrapper.element as HTMLElement;
			const restore = mockSize(wrapEl, {
				clientWidth: 200,
				clientHeight: 200,
				scrollWidth: 1000,
				scrollHeight: 200
			});

			await scrollerRef.value.refresh();
			await nextTick();

			wrapEl.dispatchEvent(new WheelEvent('wheel', {
				deltaX: 100,
				deltaY: 0,
				deltaMode: 0,
				bubbles: true,
				cancelable: true
			}));

			await sleep(30);

			expect(onScroll).toHaveBeenCalled();
			expect(scrollerRef.value.scrollLeft).toBeGreaterThan(0);

			restore();
			wrapper.unmount();
		});

		it('wheel is no-op when native=true (shouldWheelX/Y short-circuit)', async () => {
			const onScroll = vi.fn();
			const scrollerRef = ref<any>();
			const wrapper = mount(() => (
				<ScrollerWheel
					ref={scrollerRef}
					native={true}
					height="200px"
					onScroll={onScroll}
				>
					<div style="height: 1000px; width: 1000px"></div>
				</ScrollerWheel>
			), { attachTo: document.body });
			await nextTick();

			const wrapEl = wrapper.element as HTMLElement;
			const restore = mockSize(wrapEl, {
				clientWidth: 200,
				clientHeight: 200,
				scrollWidth: 1000,
				scrollHeight: 1000
			});

			await scrollerRef.value.refresh();
			await nextTick();

			wrapEl.dispatchEvent(new WheelEvent('wheel', {
				deltaY: 100,
				bubbles: true,
				cancelable: true
			}));
			await sleep(30);

			expect(onScroll).not.toHaveBeenCalled();

			restore();
			wrapper.unmount();
		});
	});

	describe('Track interactions', () => {
		it('clicking on vertical track moves scrollTop (handleClickTrack)', async () => {
			const scrollerRef = ref<any>();
			const wrapper = mount(() => (
				<Scroller ref={scrollerRef} native={false} always height="100px">
					<div style="height: 1000px"></div>
				</Scroller>
			), { attachTo: document.body });

			const wrapEl = wrapper.find('.vc-scroller__wrapper').element as HTMLElement;
			const restore = mockSize(wrapEl, {
				clientWidth: 100,
				clientHeight: 100,
				scrollWidth: 100,
				scrollHeight: 1000
			});
			await scrollerRef.value.refresh();
			await nextTick();

			const track = wrapper.find('.vc-scroller-track.is-vertical');
			expect(track.exists()).toBe(true);

			const rectSpy = vi.spyOn(track.element, 'getBoundingClientRect').mockReturnValue({
				top: 0,
				left: 0,
				right: 6,
				bottom: 100,
				width: 6,
				height: 100,
				x: 0,
				y: 0,
				toJSON: () => ({})
			} as DOMRect);

			await track.trigger('mousedown', { clientY: 80, button: 0 });
			await nextTick();

			expect(scrollerRef.value.scrollTop).toBeGreaterThan(0);

			rectSpy.mockRestore();
			restore();
			wrapper.unmount();
		});

		it('clicking on horizontal track moves scrollLeft', async () => {
			const scrollerRef = ref<any>();
			const wrapper = mount(() => (
				<Scroller ref={scrollerRef} native={false} always height="100px">
					<div style="height: 100px; width: 1000px"></div>
				</Scroller>
			), { attachTo: document.body });

			const wrapEl = wrapper.find('.vc-scroller__wrapper').element as HTMLElement;
			const restore = mockSize(wrapEl, {
				clientWidth: 100,
				clientHeight: 100,
				scrollWidth: 1000,
				scrollHeight: 100
			});
			await scrollerRef.value.refresh();
			await nextTick();

			const track = wrapper.find('.vc-scroller-track.is-horizontal');
			expect(track.exists()).toBe(true);

			const rectSpy = vi.spyOn(track.element, 'getBoundingClientRect').mockReturnValue({
				top: 0,
				left: 0,
				right: 100,
				bottom: 6,
				width: 100,
				height: 6,
				x: 0,
				y: 0,
				toJSON: () => ({})
			} as DOMRect);

			await track.trigger('mousedown', { clientX: 80, button: 0 });
			await nextTick();

			expect(scrollerRef.value.scrollLeft).toBeGreaterThan(0);

			rectSpy.mockRestore();
			restore();
			wrapper.unmount();
		});

		it('thumb mousedown + document mousemove + mouseup drives scroll', async () => {
			const scrollerRef = ref<any>();
			const wrapper = mount(() => (
				<Scroller ref={scrollerRef} native={false} always height="100px">
					<div style="height: 1000px"></div>
				</Scroller>
			), { attachTo: document.body });

			const wrapEl = wrapper.find('.vc-scroller__wrapper').element as HTMLElement;
			const restore = mockSize(wrapEl, {
				clientWidth: 100,
				clientHeight: 100,
				scrollWidth: 100,
				scrollHeight: 1000
			});
			await scrollerRef.value.refresh();
			await nextTick();

			const thumb = wrapper.find('.vc-scroller-track.is-vertical .vc-scroller-track__thumb');
			expect(thumb.exists()).toBe(true);

			await thumb.trigger('mousedown', { clientY: 5, button: 0 });

			document.body.dispatchEvent(new MouseEvent('mousemove', {
				clientY: 50,
				bubbles: true
			}));
			await nextTick();

			document.body.dispatchEvent(new MouseEvent('mouseup', {
				bubbles: true
			}));
			await nextTick();

			expect(scrollerRef.value.scrollTop).toBeGreaterThan(0);

			restore();
			wrapper.unmount();
		});

		it('thumb mousedown is ignored for right/middle button', async () => {
			const scrollerRef = ref<any>();
			const wrapper = mount(() => (
				<Scroller ref={scrollerRef} native={false} always height="100px">
					<div style="height: 1000px"></div>
				</Scroller>
			), { attachTo: document.body });

			const wrapEl = wrapper.find('.vc-scroller__wrapper').element as HTMLElement;
			const restore = mockSize(wrapEl, {
				clientHeight: 100,
				scrollHeight: 1000
			});
			await scrollerRef.value.refresh();
			await nextTick();

			const thumb = wrapper.find('.vc-scroller-track.is-vertical .vc-scroller-track__thumb');
			await thumb.trigger('mousedown', { clientY: 10, button: 2 });

			document.body.dispatchEvent(new MouseEvent('mousemove', {
				clientY: 50,
				bubbles: true
			}));

			expect(scrollerRef.value.scrollTop).toBe(0);

			restore();
			wrapper.unmount();
		});

		it('mousemove on track parent shows track; mouseleave hides it', async () => {
			const scrollerRef = ref<any>();
			const wrapper = mount(() => (
				<Scroller ref={scrollerRef} native={false} height="100px">
					<div style="height: 1000px"></div>
				</Scroller>
			), { attachTo: document.body });

			const wrapEl = wrapper.find('.vc-scroller__wrapper').element as HTMLElement;
			const restore = mockSize(wrapEl, {
				clientHeight: 100,
				scrollHeight: 1000
			});
			await scrollerRef.value.refresh();
			await nextTick();

			const trackEl = wrapper.find('.vc-scroller-track.is-vertical').element as HTMLElement;
			const parentEl = trackEl.parentElement!;

			parentEl.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
			await nextTick();
			expect(trackEl.style.display).not.toBe('none');

			parentEl.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
			await nextTick();
			expect(trackEl.style.display).toBe('none');

			restore();
			wrapper.unmount();
		});

		it('scrollTo updates thumb transform via raf', async () => {
			const scrollerRef = ref<any>();
			const wrapper = mount(() => (
				<Scroller ref={scrollerRef} native={false} always height="100px">
					<div style="height: 1000px"></div>
				</Scroller>
			), { attachTo: document.body });

			const wrapEl = wrapper.find('.vc-scroller__wrapper').element as HTMLElement;
			const restore = mockSize(wrapEl, {
				clientHeight: 100,
				scrollHeight: 1000
			});
			await scrollerRef.value.refresh();
			await nextTick();

			scrollerRef.value.setScrollTop(200);
			await sleep(50);

			const thumb = wrapper.find('.vc-scroller-track.is-vertical .vc-scroller-track__thumb').element as HTMLElement;
			expect(thumb.style.transform || thumb.getAttribute('style') || '').toMatch(/translateY/);

			restore();
			wrapper.unmount();
		});
	});

	describe('utils', () => {
		it('isWheel detects vc-scroller-wheel className', () => {
			const el = document.createElement('div');
			el.className = 'vc-scroller-wheel something';
			expect(isWheel(el)).toBe(true);

			const other = document.createElement('div');
			other.className = 'foo bar';
			expect(isWheel(other)).toBe(false);

			expect(isWheel(null)).toBe(false);
		});

		it('getScroller walks up to the closest vc-scroller-wheel ancestor', () => {
			const root = document.createElement('div');
			root.className = 'vc-scroller-wheel';
			const inner = document.createElement('span');
			root.appendChild(inner);
			document.body.appendChild(root);

			expect(getScroller(inner)).toBe(root);

			document.body.removeChild(root);
		});
	});
});
