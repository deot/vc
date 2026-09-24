// @vitest-environment jsdom

import { Customer, Scroller, ScrollerWheel } from '@deot/vc-components';
import { getPadding, getScroller, getViewportRect } from '../utils';
import { Bar } from '../bar';
import { mount } from '@vue/test-utils';
import { nextTick, reactive, ref } from 'vue';
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

		it('barTo accepts an element and follows it when it changes', async () => {
			const first = document.createElement('div');
			const second = document.createElement('div');
			document.body.appendChild(first);
			document.body.appendChild(second);

			const to = ref<HTMLElement>(first);
			const wrapper = mount(() => (
				<Scroller native={false} always height="200px" barTo={to.value}>
					<div style="height: 1000px"></div>
				</Scroller>
			), { attachTo: document.body });

			await sleep();
			await nextTick();
			expect(first.querySelector('.vc-scroller-track')).toBeTruthy();

			to.value = second;
			await sleep();
			await nextTick();
			expect(first.querySelector('.vc-scroller-track')).toBeFalsy();
			expect(second.querySelector('.vc-scroller-track')).toBeTruthy();

			wrapper.unmount();
			first.remove();
			second.remove();
		});

		it('rebinds the hover container when an element barTo changes (no barTrigger)', async () => {
			const first = document.createElement('div');
			const second = document.createElement('div');
			document.body.appendChild(first);
			document.body.appendChild(second);

			const to = ref<HTMLElement>(first);
			const scrollerRef = ref<any>();
			const wrapper = mount(() => (
				<Scroller ref={scrollerRef} native={false} height="100px" barTo={to.value}>
					<div style="height: 1000px"></div>
				</Scroller>
			), { attachTo: document.body });

			const wrapEl = wrapper.find('.vc-scroller__wrapper').element as HTMLElement;
			const restore = mockSize(wrapEl, { clientHeight: 100, scrollHeight: 1000 });
			await scrollerRef.value.refresh();
			await sleep();
			await nextTick();

			to.value = second;
			await sleep();
			await nextTick();

			const trackEl = second.querySelector('.vc-scroller-track.is-vertical') as HTMLElement;
			expect(trackEl).toBeTruthy();
			expect(trackEl.style.display).toBe('none');

			// 旧容器不再触发显示
			first.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
			await nextTick();
			expect(trackEl.style.display).toBe('none');

			// 新容器触发显示 / 隐藏
			second.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
			await nextTick();
			expect(trackEl.style.display).not.toBe('none');
			second.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
			await nextTick();
			expect(trackEl.style.display).toBe('none');

			restore();
			wrapper.unmount();
			first.remove();
			second.remove();
		});

		it('rebinds the hover container when barTrigger changes', async () => {
			const a = document.createElement('div');
			a.className = 'bar-trigger-a';
			const b = document.createElement('div');
			b.className = 'bar-trigger-b';
			document.body.appendChild(a);
			document.body.appendChild(b);

			const trigger = ref('.bar-trigger-a');
			const scrollerRef = ref<any>();
			const wrapper = mount(() => (
				<Scroller ref={scrollerRef} native={false} height="100px" barTrigger={trigger.value}>
					<div style="height: 1000px"></div>
				</Scroller>
			), { attachTo: document.body });

			const wrapEl = wrapper.find('.vc-scroller__wrapper').element as HTMLElement;
			const restore = mockSize(wrapEl, { clientHeight: 100, scrollHeight: 1000 });
			await scrollerRef.value.refresh();
			await nextTick();

			trigger.value = '.bar-trigger-b';
			await nextTick();
			await nextTick();

			const trackEl = wrapper.find('.vc-scroller-track.is-vertical').element as HTMLElement;
			a.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
			await nextTick();
			expect(trackEl.style.display).toBe('none');
			b.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
			await nextTick();
			expect(trackEl.style.display).not.toBe('none');

			restore();
			wrapper.unmount();
			a.remove();
			b.remove();
		});

		it('barTrigger shows the track while hovering an ancestor of the barTo target', async () => {
			// 轨道挂在 0 高的锚点里，锚点自身无法悬停；悬停区域交给祖先
			const trigger = document.createElement('div');
			trigger.className = 'bar-trigger-host';
			const anchor = document.createElement('div');
			trigger.appendChild(anchor);
			document.body.appendChild(trigger);

			const scrollerRef = ref<any>();
			const wrapper = mount(() => (
				<Scroller ref={scrollerRef} native={false} height="100px" barTo={anchor} barTrigger=".bar-trigger-host">
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
			await nextTick();

			const trackEl = anchor.querySelector('.vc-scroller-track.is-vertical') as HTMLElement;
			expect(trackEl).toBeTruthy();
			expect(trackEl.style.display).toBe('none');

			trigger.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
			await nextTick();
			expect(trackEl.style.display).not.toBe('none');

			trigger.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
			await nextTick();
			expect(trackEl.style.display).toBe('none');

			restore();
			wrapper.unmount();
			trigger.remove();
		});

		it('barTrigger resolves outside the track ancestors and falls back to the parent when missing', async () => {
			const trigger = document.createElement('div');
			trigger.className = 'bar-trigger-outside';
			document.body.appendChild(trigger);

			const mountWith = (barTrigger: string) => {
				const scrollerRef = ref<any>();
				const wrapper = mount(() => (
					<Scroller ref={scrollerRef} native={false} height="100px" barTrigger={barTrigger}>
						<div style="height: 1000px"></div>
					</Scroller>
				), { attachTo: document.body });
				return { wrapper, scrollerRef };
			};

			// 不是轨道的祖先：按文档首个匹配
			const outside = mountWith('.bar-trigger-outside');
			let wrapEl = outside.wrapper.find('.vc-scroller__wrapper').element as HTMLElement;
			let restore = mockSize(wrapEl, { clientHeight: 100, scrollHeight: 1000 });
			await outside.scrollerRef.value.refresh();
			await nextTick();
			let trackEl = outside.wrapper.find('.vc-scroller-track.is-vertical').element as HTMLElement;
			trigger.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
			await nextTick();
			expect(trackEl.style.display).not.toBe('none');
			restore();
			outside.wrapper.unmount();

			// 找不到时回退为轨道所在的容器
			const missing = mountWith('.bar-trigger-missing');
			wrapEl = missing.wrapper.find('.vc-scroller__wrapper').element as HTMLElement;
			restore = mockSize(wrapEl, { clientHeight: 100, scrollHeight: 1000 });
			await missing.scrollerRef.value.refresh();
			await nextTick();
			trackEl = missing.wrapper.find('.vc-scroller-track.is-vertical').element as HTMLElement;
			trackEl.parentElement!.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
			await nextTick();
			expect(trackEl.style.display).not.toBe('none');
			restore();
			missing.wrapper.unmount();

			trigger.remove();
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

		it('syncs position and emits scroll on external scroll when native=false', async () => {
			const onScroll = vi.fn();
			const scrollerRef = ref<any>();
			const wrapper = mount(() => (
				<ScrollerWheel ref={scrollerRef} native={false} height="200px" onScroll={onScroll}>
					<div style="height: 1000px"></div>
				</ScrollerWheel>
			), { attachTo: document.body });
			await nextTick();

			const wrapEl = wrapper.element as HTMLElement;
			// 聚焦、scrollIntoView等由浏览器直接改写scrollTop
			await makeScroll(wrapEl, 'scrollTop', 50);

			expect(onScroll).toHaveBeenCalledTimes(1);
			expect(onScroll.mock.calls[0][0].target.scrollTop).toBe(50);
			expect(scrollerRef.value.scrollTop).toBe(50);

			wrapper.unmount();
		});

		it('does NOT emit scroll twice for its own scrollTo when native=false', async () => {
			const onScroll = vi.fn();
			const scrollerRef = ref<any>();
			const wrapper = mount(() => (
				<ScrollerWheel ref={scrollerRef} native={false} height="200px" onScroll={onScroll}>
					<div style="height: 1000px; width: 1000px"></div>
				</ScrollerWheel>
			), { attachTo: document.body });
			await nextTick();

			scrollerRef.value.scrollTo({ x: 10, y: 20 });
			expect(onScroll).toHaveBeenCalledTimes(1);

			// scrollTo写入DOM后浏览器随后派发的scroll
			wrapper.element.dispatchEvent(new CustomEvent('scroll'));
			await sleep();
			expect(onScroll).toHaveBeenCalledTimes(1);

			wrapper.unmount();
		});

		it('wheel continues from the externally scrolled position when native=false', async () => {
			const scrollerRef = ref<any>();
			const wrapper = mount(() => (
				<ScrollerWheel ref={scrollerRef} native={false} height="200px">
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

			await makeScroll(wrapEl, 'scrollTop', 300);

			wrapEl.dispatchEvent(new WheelEvent('wheel', {
				deltaY: 100,
				deltaX: 0,
				deltaMode: 0,
				bubbles: true,
				cancelable: true
			}));
			await sleep(30);

			// 修复前：从旧位置0开始 -> 100
			expect(scrollerRef.value.scrollTop).toBe(400);
			expect(wrapEl.scrollTop).toBe(400);

			restore();
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

	describe('Bar mode', () => {
		const flush = async () => {
			await sleep();
			await nextTick();
			await nextTick();
		};
		const tracksIn = (el: Element) => [...el.children].filter(
			child => child.classList.contains('vc-scroller-track')
		) as HTMLElement[];
		const trackOf = (tracks: HTMLElement[], cls: string) => tracks.find(el => el.classList.contains(cls))!;
		// 保留真实 Transition：默认的 transition-stub 会多包一层，无法验证轨道是滚动容器的直接子元素

		it('ScrollerWheel pins tracks with sticky inside the wrapper', async () => {
			const scrollerRef = ref<any>();
			const wrapper = mount(() => (
				<ScrollerWheel
					ref={scrollerRef}
					native={false}
					always
					height="200px"
					trackOffsetX={[0, 5, 6, 7]}
					trackOffsetY={[8, 9, 10, 11]}
				>
					<div style="height: 1000px; width: 1000px"></div>
				</ScrollerWheel>
			), { attachTo: document.body, global: { stubs: { transition: false } } });

			const wrapEl = wrapper.element as HTMLElement;
			const restore = mockSize(wrapEl, {
				clientWidth: 200,
				clientHeight: 200,
				scrollWidth: 1000,
				scrollHeight: 1000
			});
			await scrollerRef.value.refresh();
			await flush();

			// 轨道是滚动容器的直接子元素
			const tracks = tracksIn(wrapEl);
			expect(tracks.length).toBe(2);
			tracks.forEach(el => expect(el.classList.contains('is-sticky')).toBe(true));

			// 竖轨：长度 = 可视高度 - 上偏移，负 margin 抵消占位
			const vertical = trackOf(tracks, 'is-vertical');
			expect(vertical.style.top).toBe('8px');
			expect(vertical.style.height).toBe('192px');
			expect(vertical.style.marginTop).toBe('-192px');
			expect(vertical.style.marginRight).toBe('9px');
			expect(vertical.style.getPropertyValue('--vc-scroller-track-offset')).toBe('9px');

			// 横轨：长度 = 可视宽度 - 左偏移
			const horizontal = trackOf(tracks, 'is-horizontal');
			expect(horizontal.style.left).toBe('7px');
			expect(horizontal.style.bottom).toBe('6px');
			expect(horizontal.style.width).toBe('193px');
			expect(horizontal.style.marginLeft).toBe('7px');
			expect(horizontal.style.getPropertyValue('--vc-scroller-track-offset')).toBe('6px');

			// 滚动后不再用 transform 补偿位移
			scrollerRef.value.scrollTo({ x: 100, y: 300 });
			await nextTick();
			tracks.forEach(el => expect(el.getAttribute('style') ?? '').not.toContain('translate('));

			restore();
			wrapper.unmount();
		});

		it('ScrollerWheel with barTo keeps tracks absolute in the target', async () => {
			const target = document.createElement('div');
			target.className = 'bar-to-wheel-target';
			document.body.appendChild(target);

			const scrollerRef = ref<any>();
			const wrapper = mount(() => (
				<ScrollerWheel
					ref={scrollerRef}
					native={false}
					always
					height="200px"
					barTo=".bar-to-wheel-target"
					trackOffsetY={[8, 9, 10, 11]}
				>
					<div style="height: 1000px; width: 1000px"></div>
				</ScrollerWheel>
			), { attachTo: document.body, global: { stubs: { transition: false } } });

			const wrapEl = wrapper.element as HTMLElement;
			const restore = mockSize(wrapEl, {
				clientWidth: 200,
				clientHeight: 200,
				scrollWidth: 1000,
				scrollHeight: 1000
			});
			await scrollerRef.value.refresh();
			await flush();

			expect(tracksIn(wrapEl).length).toBe(0);
			const tracks = tracksIn(target);
			expect(tracks.length).toBe(2);
			tracks.forEach((el) => {
				expect(el.classList.contains('is-sticky')).toBe(false);
				expect(el.style.marginTop).toBe('');
				expect(el.style.getPropertyValue('--vc-scroller-track-offset')).toBe('');
			});
			const vertical = trackOf(tracks, 'is-vertical');
			expect(vertical.style.top).toBe('8px');
			expect(vertical.style.right).toBe('9px');
			expect(vertical.style.height).toBe('');

			restore();
			wrapper.unmount();
			target.parentNode?.removeChild(target);
		});

		it('Scroller keeps tracks absolute outside the wrapper', async () => {
			const scrollerRef = ref<any>();
			const wrapper = mount(() => (
				<Scroller ref={scrollerRef} native={false} always height="200px">
					<div style="height: 1000px; width: 1000px"></div>
				</Scroller>
			), { attachTo: document.body, global: { stubs: { transition: false } } });

			const wrapEl = wrapper.find('.vc-scroller__wrapper').element;
			const restore = mockSize(wrapEl, {
				clientWidth: 200,
				clientHeight: 200,
				scrollWidth: 1000,
				scrollHeight: 1000
			});
			await scrollerRef.value.refresh();
			await flush();

			expect(wrapEl.querySelector('.vc-scroller-track')).toBeNull();
			const tracks = tracksIn(wrapper.element);
			expect(tracks.length).toBe(2);
			tracks.forEach((el) => {
				expect(el.classList.contains('is-sticky')).toBe(false);
				expect(el.style.marginTop).toBe('');
			});

			restore();
			wrapper.unmount();
		});

		it('Bar mode=translate compensates the scroll offset with transform', async () => {
			const host = document.createElement('div');
			const target = document.createElement('div');
			target.id = 'bar-translate-target';
			document.body.append(host, target);

			const state = reactive<{ to?: string }>({});
			const wrapper = mount(() => (
				<Bar
					native={false}
					always
					mode="translate"
					to={state.to}
					wrapperW={200}
					wrapperH={200}
					contentW={1000}
					contentH={1000}
					scrollX={30}
					scrollY={40}
				/>
			), { attachTo: host, global: { stubs: { transition: false } } });
			await flush();

			// attachTo 会在 host 内再包一层挂载节点
			const tracks = [...host.querySelectorAll('.vc-scroller-track')] as HTMLElement[];
			expect(tracks.length).toBe(2);
			tracks.forEach((el) => {
				expect(el.classList.contains('is-sticky')).toBe(false);
				// transform 可能带厂商前缀，读 style 属性
				expect(el.getAttribute('style') ?? '').toContain('translate(30px, 40px)');
			});

			// 移出滚动容器后不再补偿
			state.to = '#bar-translate-target';
			await flush();
			const moved = tracksIn(target);
			expect(moved.length).toBe(2);
			moved.forEach(el => expect(el.getAttribute('style') ?? '').not.toContain('translate('));

			wrapper.unmount();
			host.remove();
			target.remove();
		});
	});

	describe('Track interactions', () => {
		it.each([Scroller, ScrollerWheel])('passes track styling through %s', async (Component) => {
			const wrapper = mount(Component, {
				props: {
					native: false,
					trackClass: 'custom-track',
					trackStyle: { opacity: '0.5' }
				}
			});
			await nextTick();
			await nextTick();

			const tracks = wrapper.findAll('.vc-scroller-track');
			expect(tracks).toHaveLength(2);
			tracks.forEach((track) => {
				expect(track.classes()).toContain('custom-track');
				expect((track.element as HTMLElement).style.opacity).toBe('0.5');
			});
			wrapper.unmount();
		});

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

	describe('render reconciliation', () => {
		it('Scroller does not re-render renderItem on scroll', async () => {
			const renderItem = vi.fn((props: any) => <div class="item">{ props.index }</div>);
			const renderList = vi.fn((props: any) => {
				const { length } = props;
				return Array.from({ length }, (_, i) => i + 1).map(item => (
					<Customer key={item} render={renderItem} index={item} />
				));
			});

			const length = ref(100);
			const scrollerRef = ref<any>();
			const wrapper = mount(() => (
				<Scroller ref={scrollerRef} native={false} height="200px">
					<Customer length={length.value} render={renderList} />
				</Scroller>
			), { attachTo: document.body });

			await nextTick();

			expect(renderList).toHaveBeenCalledTimes(1);
			expect(renderItem).toHaveBeenCalledTimes(100);
			expect(wrapper.findAll('.item').length).toBe(100);

			const wrapEl = wrapper.find('.vc-scroller__wrapper').element as HTMLElement;
			const restore = mockSize(wrapEl, {
				clientWidth: 200,
				clientHeight: 200,
				scrollWidth: 200,
				scrollHeight: 1000
			});

			await scrollerRef.value.refresh();
			await nextTick();

			// 滚动多次, renderItem不应被再次调用
			await makeScroll(wrapEl, 'scrollTop', 100);
			await makeScroll(wrapEl, 'scrollTop', 200);
			await makeScroll(wrapEl, 'scrollTop', 300);

			expect(renderItem).toHaveBeenCalledTimes(100);
			expect(renderList).toHaveBeenCalledTimes(1);

			// 确保新增1条数据后renderItem只执行1次, 而不是执行101次
			length.value = 101;
			await nextTick();

			expect(renderList).toHaveBeenCalledTimes(2);
			expect(renderItem).toHaveBeenCalledTimes(101);
			expect(wrapper.findAll('.item').length).toBe(101);

			restore();
			wrapper.unmount();
		});

		it('ScrollerWheel does not re-render renderItem on wheel scroll', async () => {
			const renderItem = vi.fn((props: any) => <div class="item">{ props.index }</div>);
			const renderList = vi.fn((props: any) => {
				const { length } = props;
				return Array.from({ length }, (_, i) => i + 1).map(item => (
					<Customer key={item} render={renderItem} index={item} />
				));
			});

			const length = ref(100);
			const scrollerRef = ref<any>();
			const wrapper = mount(() => (
				<ScrollerWheel ref={scrollerRef} native={false} height="200px">
					<Customer length={length.value} render={renderList} />
				</ScrollerWheel>
			), { attachTo: document.body });

			await nextTick();

			expect(renderList).toHaveBeenCalledTimes(1);
			expect(renderItem).toHaveBeenCalledTimes(100);
			expect(wrapper.findAll('.item').length).toBe(100);

			const wrapEl = wrapper.element as HTMLElement;
			const restore = mockSize(wrapEl, {
				clientWidth: 200,
				clientHeight: 200,
				scrollWidth: 200,
				scrollHeight: 1000
			});

			await scrollerRef.value.refresh();
			await nextTick();

			// wheel滚动多次, renderItem不应被再次调用
			wrapEl.dispatchEvent(new WheelEvent('wheel', {
				deltaY: 100,
				deltaX: 0,
				deltaMode: 0,
				bubbles: true,
				cancelable: true
			}));
			await sleep(30);

			wrapEl.dispatchEvent(new WheelEvent('wheel', {
				deltaY: 200,
				deltaX: 0,
				deltaMode: 0,
				bubbles: true,
				cancelable: true
			}));
			await sleep(30);

			expect(scrollerRef.value.scrollTop).toBeGreaterThan(0);
			expect(renderItem).toHaveBeenCalledTimes(100);
			expect(renderList).toHaveBeenCalledTimes(1);

			// 确保新增1条数据后renderItem只执行1次, 而不是执行101次
			length.value = 101;
			await nextTick();

			expect(renderList).toHaveBeenCalledTimes(2);
			expect(renderItem).toHaveBeenCalledTimes(101);
			expect(wrapper.findAll('.item').length).toBe(101);

			restore();
			wrapper.unmount();
		});

		it('ScrollerWheel does not re-render v-for renderItem on wheel scroll', async () => {
			const renderItem = vi.fn((props: any) => <p class="item">{ props.index }</p>);

			const count = ref(100);
			const scrollerRef = ref<any>();
			const wrapper = mount(() => (
				<ScrollerWheel ref={scrollerRef} native={false} height="200px">
					{
						Array.from({ length: count.value }, (_, i) => i + 1).map(item => (
							<Customer key={item} render={renderItem} index={item} />
						))
					}
				</ScrollerWheel>
			), { attachTo: document.body });

			await nextTick();

			expect(renderItem).toHaveBeenCalledTimes(100);
			expect(wrapper.findAll('.item').length).toBe(100);

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
				deltaY: 150,
				deltaX: 0,
				deltaMode: 0,
				bubbles: true,
				cancelable: true
			}));
			await sleep(30);

			expect(scrollerRef.value.scrollTop).toBeGreaterThan(0);
			expect(renderItem).toHaveBeenCalledTimes(100);

			// 新增一条仅触发一次新增项的渲染
			count.value = 101;
			await nextTick();

			expect(renderItem).toHaveBeenCalledTimes(101);
			expect(wrapper.findAll('.item').length).toBe(101);

			restore();
			wrapper.unmount();
		});
	});

	describe('utils', () => {
		it('getPadding reads the computed padding as [top, right, bottom, left]', () => {
			const el = document.createElement('div');
			document.body.appendChild(el);
			expect(getPadding(el)).toEqual([0, 0, 0, 0]);

			el.style.padding = '10px 20px 30px 40px';
			expect(getPadding(el)).toEqual([10, 20, 30, 40]);

			el.remove();
		});

		it('getViewportRect excludes border and padding, and scales them with the element', () => {
			const el = document.createElement('div');
			el.style.padding = '10px 20px 30px 40px';
			document.body.appendChild(el);
			const restores = [
				defineGetter(el, 'clientTop', 2),
				defineGetter(el, 'clientLeft', 3),
				defineGetter(el, 'clientWidth', 300),
				defineGetter(el, 'clientHeight', 200),
				defineGetter(el, 'offsetHeight', 205)
			];
			const rect = (height: number) => ({ top: 100, left: 50, right: 0, bottom: 0, width: 0, height, x: 0, y: 0, toJSON: () => ({}) });

			// 未缩放：可视区 = 边框盒 - 边框 - padding
			el.getBoundingClientRect = () => rect(205);
			expect(getViewportRect(el)).toEqual({ top: 112, right: 333, bottom: 272, left: 93, scale: 1 });

			// 祖先 transform: scale(0.5)：边框与 padding 按同一比例换算
			el.getBoundingClientRect = () => rect(102.5);
			expect(getViewportRect(el)).toEqual({ top: 106, right: 191.5, bottom: 186, left: 71.5, scale: 0.5 });

			restores.forEach(fn => fn());
			el.remove();
		});

		it('getViewportRect of window is the whole viewport', () => {
			expect(getViewportRect(window)).toEqual({ top: 0, right: window.innerWidth, bottom: window.innerHeight, left: 0, scale: 1 });
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

		it('getScroller recognizes the Scroller root by class even before styles load', () => {
			const root = document.createElement('div');
			root.className = 'vc-scroller vc-scroller__wrapper';
			const inner = document.createElement('span');
			root.appendChild(inner);
			document.body.appendChild(root);

			expect(getScroller(inner)).toBe(root);

			document.body.removeChild(root);
		});
	});
});
