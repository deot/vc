// @vitest-environment jsdom

import { Carousel, CarouselItem } from '@deot/vc-components';
import { MCarousel, MCarouselItem } from '../index.m';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick, reactive, ref } from 'vue';
import { vi } from 'vitest';

const sleep = (time = 0) => new Promise<void>(r => setTimeout(r, time));

const flushAll = async () => {
	await nextTick();
	await nextTick();
	await nextTick();
};

const useFakeTimers = () => {
	vi.useFakeTimers({
		toFake: [
			'setTimeout',
			'clearTimeout',
			'setInterval',
			'clearInterval',
			'Date'
		]
	});
};

const defineGetter = (obj: any, prop: string, value: any) => {
	const old = Object.getOwnPropertyDescriptor(obj, prop);
	Object.defineProperty(obj, prop, { configurable: true, get: () => value });
	return () => {
		if (old) Object.defineProperty(obj, prop, old);
		else delete obj[prop];
	};
};

const mockOffsetSize = (root: HTMLElement, width = 600, height = 300) => {
	const restores: Array<() => void> = [];
	const apply = (el: HTMLElement) => {
		restores.push(defineGetter(el, 'offsetWidth', width));
		restores.push(defineGetter(el, 'offsetHeight', height));
		restores.push(defineGetter(el, 'clientWidth', width));
		restores.push(defineGetter(el, 'clientHeight', height));
	};
	apply(root);
	root.querySelectorAll<HTMLElement>('*').forEach(apply);
	return () => restores.forEach(fn => fn());
};

const fireMouse = (
	el: Element,
	type: 'mousedown' | 'mousemove' | 'mouseup' | 'mouseenter' | 'mouseleave',
	screenX = 0,
	screenY = 0
) => {
	const ev = new MouseEvent(type, { bubbles: true, cancelable: true, screenX, screenY });
	el.dispatchEvent(ev);
};

const fireTouch = (
	el: Element,
	type: 'touchstart' | 'touchmove' | 'touchend',
	screenX = 0,
	screenY = 0
) => {
	const ev = new Event(type, { bubbles: true, cancelable: true }) as any;
	const touch = { screenX, screenY };
	ev.touches = [touch];
	ev.changedTouches = [touch];
	ev.targetTouches = [touch];
	return el.dispatchEvent(ev);
};

describe('index.ts', () => {
	let restoreSize: (() => void) | null = null;

	afterEach(() => {
		restoreSize?.();
		restoreSize = null;
		vi.useRealTimers();
	});

	describe('basic', () => {
		it('exports', () => {
			expect(typeof Carousel).toBe('object');
			expect(typeof CarouselItem).toBe('object');
			expect(typeof MCarousel).toBe('object');
			expect(typeof MCarouselItem).toBe('object');
		});

		it('create renders root class', () => {
			const wrapper = mount(() => (<Carousel />));
			expect(wrapper.classes()).toContain('vc-carousel');
			wrapper.unmount();
		});

		it('default direction is horizontal', async () => {
			const wrapper = mount(() => (
				<Carousel autoplay={false}>
					<CarouselItem />
					<CarouselItem />
					<CarouselItem />
				</Carousel>
			));
			await flushAll();
			expect(wrapper.classes()).toContain('is-horizontal');
			expect(wrapper.findAll('.vc-carousel-item').length).toBe(3);
			wrapper.unmount();
		});

		it('renders height when set', async () => {
			const wrapper = mount(() => (
				<Carousel autoplay={false} height={150}>
					<CarouselItem />
				</Carousel>
			));
			await flushAll();
			const inner = wrapper.find('.vc-carousel__wrapper').element as HTMLElement;
			expect(inner.style.height).toBe('150px');
			wrapper.unmount();
		});

		it('height defaults to auto when not set', async () => {
			const wrapper = mount(() => (
				<Carousel autoplay={false}>
					<CarouselItem />
				</Carousel>
			));
			await flushAll();
			const inner = wrapper.find('.vc-carousel__wrapper').element as HTMLElement;
			expect(inner.style.height).toBe('auto');
			wrapper.unmount();
		});
	});

	describe('autoplay & timer', () => {
		it('auto play switches active item', async () => {
			useFakeTimers();
			const wrapper = mount(() => (
				<Carousel t={50}>
					<CarouselItem />
					<CarouselItem />
					<CarouselItem />
				</Carousel>
			));

			await flushAll();
			const items = wrapper.findAll('.vc-carousel-item');
			expect(items[0].classes()).toContain('is-active');

			vi.advanceTimersByTime(60);
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item')[1].classes()).toContain('is-active');

			wrapper.unmount();
		});

		it('autoplay=false does not auto switch', async () => {
			useFakeTimers();
			const wrapper = mount(() => (
				<Carousel autoplay={false} t={50}>
					<CarouselItem />
					<CarouselItem />
				</Carousel>
			));
			await flushAll();
			vi.advanceTimersByTime(500);
			await flushAll();
			const items = wrapper.findAll('.vc-carousel-item');
			expect(items[0].classes()).toContain('is-active');
			expect(items[1].classes()).not.toContain('is-active');
			wrapper.unmount();
		});

		it('t<=0 does not start timer', async () => {
			useFakeTimers();
			const wrapper = mount(() => (
				<Carousel t={0}>
					<CarouselItem />
					<CarouselItem />
				</Carousel>
			));
			await flushAll();
			vi.advanceTimersByTime(500);
			await flushAll();
			const items = wrapper.findAll('.vc-carousel-item');
			expect(items[0].classes()).toContain('is-active');
			expect(items[1].classes()).not.toContain('is-active');
			wrapper.unmount();
		});

		it('mouseenter pauses, mouseleave resumes timer', async () => {
			useFakeTimers();
			const wrapper = mount(() => (
				<Carousel t={500}>
					<CarouselItem />
					<CarouselItem />
				</Carousel>
			));
			await flushAll();

			fireMouse(wrapper.element, 'mouseenter');
			await flushAll();
			vi.advanceTimersByTime(800);
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item')[0].classes()).toContain('is-active');

			fireMouse(wrapper.element, 'mouseleave');
			await flushAll();
			vi.advanceTimersByTime(800);
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item')[1].classes()).toContain('is-active');

			wrapper.unmount();
		});

		it('toggles timer when autoplay prop changes', async () => {
			useFakeTimers();
			const autoplay = ref(false);
			const Wrapper = defineComponent({
				setup() {
					return () => (
						<Carousel autoplay={autoplay.value} t={50}>
							<CarouselItem />
							<CarouselItem />
							<CarouselItem />
						</Carousel>
					);
				}
			});
			const wrapper = mount(Wrapper);
			await flushAll();

			vi.advanceTimersByTime(120);
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item')[0].classes()).toContain('is-active');

			autoplay.value = true;
			await flushAll();
			vi.advanceTimersByTime(60);
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item')[1].classes()).toContain('is-active');

			autoplay.value = false;
			await flushAll();
			const before = wrapper.findAll('.vc-carousel-item')
				.findIndex(it => it.classes().includes('is-active'));
			vi.advanceTimersByTime(500);
			await flushAll();
			const after = wrapper.findAll('.vc-carousel-item')
				.findIndex(it => it.classes().includes('is-active'));
			expect(after).toBe(before);
			wrapper.unmount();
		});

		it('changing t prop restarts the timer', async () => {
			useFakeTimers();
			const t = ref(500);
			const Wrapper = defineComponent({
				setup() {
					return () => (
						<Carousel t={t.value}>
							<CarouselItem />
							<CarouselItem />
						</Carousel>
					);
				}
			});
			const wrapper = mount(Wrapper);
			await flushAll();

			t.value = 30;
			await flushAll();
			vi.advanceTimersByTime(50);
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item')[1].classes()).toContain('is-active');
			wrapper.unmount();
		});
	});

	describe('initialIndex', () => {
		it('renders initial index', async () => {
			const wrapper = mount(() => (
				<Carousel autoplay={false} initialIndex={1}>
					<CarouselItem />
					<CarouselItem />
					<CarouselItem />
				</Carousel>
			));
			await flushAll();
			const items = wrapper.findAll('.vc-carousel-item');
			expect(items[1].classes()).toContain('is-active');
			wrapper.unmount();
		});

		it('out-of-range initialIndex with loop=true falls back to 0', async () => {
			const wrapper = mount(() => (
				<Carousel autoplay={false} initialIndex={99} loop>
					<CarouselItem />
					<CarouselItem />
					<CarouselItem />
				</Carousel>
			));
			await flushAll();
			const items = wrapper.findAll('.vc-carousel-item');
			expect(items[0].classes()).toContain('is-active');
			wrapper.unmount();
		});

		it('out-of-range with loop=false clamps to last item', async () => {
			const wrapper = mount(() => (
				<Carousel autoplay={false} initialIndex={99} loop={false}>
					<CarouselItem />
					<CarouselItem />
					<CarouselItem />
				</Carousel>
			));
			await flushAll();
			const items = wrapper.findAll('.vc-carousel-item');
			expect(items[2].classes()).toContain('is-active');
			wrapper.unmount();
		});
	});

	describe('change event', () => {
		it('emits change(newIndex, oldIndex) when active changes', async () => {
			useFakeTimers();
			const state = reactive({ val: -1, oldVal: -1, count: 0 });
			const wrapper = mount(() => (
				<Carousel
					t={50}
					onChange={(v: number, o: number) => {
						state.val = v;
						state.oldVal = o;
						state.count++;
					}}
				>
					<CarouselItem />
					<CarouselItem />
					<CarouselItem />
				</Carousel>
			));
			await flushAll();
			vi.advanceTimersByTime(60);
			await flushAll();

			expect(state.val).toBe(1);
			expect(state.oldVal).toBe(0);
			wrapper.unmount();
		});
	});

	describe('dots', () => {
		it('renders dots by default at bottom', async () => {
			const wrapper = mount(() => (
				<Carousel autoplay={false}>
					<CarouselItem />
					<CarouselItem />
				</Carousel>
			));
			await flushAll();
			const dots = wrapper.findAll('.vc-carousel__dot');
			expect(dots.length).toBe(2);
			expect(wrapper.find('.vc-carousel__dots').classes()).toContain('is-horizontal');
			wrapper.unmount();
		});

		it('dots=false hides dots', async () => {
			const wrapper = mount(() => (
				<Carousel autoplay={false} dots={false}>
					<CarouselItem />
				</Carousel>
			));
			await flushAll();
			expect(wrapper.find('.vc-carousel__dots').exists()).toBe(false);
			wrapper.unmount();
		});

		it('dots="outside" adds is-outside class', async () => {
			const wrapper = mount(() => (
				<Carousel autoplay={false} dots="outside">
					<CarouselItem />
					<CarouselItem />
				</Carousel>
			));
			await flushAll();
			expect(wrapper.find('.vc-carousel__dots').classes()).toContain('is-outside');
			wrapper.unmount();
		});

		it('vertical dots add is-vertical class', async () => {
			const wrapper = mount(() => (
				<Carousel autoplay={false} vertical>
					<CarouselItem />
					<CarouselItem />
				</Carousel>
			));
			await flushAll();
			expect(wrapper.classes()).toContain('is-vertical');
			expect(wrapper.find('.vc-carousel__dots').classes()).toContain('is-vertical');
			wrapper.unmount();
		});

		it('clicking a dot switches active', async () => {
			const wrapper = mount(() => (
				<Carousel autoplay={false}>
					<CarouselItem />
					<CarouselItem />
					<CarouselItem />
				</Carousel>
			));
			await flushAll();
			const dots = wrapper.findAll('.vc-carousel__dot');
			expect(dots.length).toBe(3);
			await dots[2].trigger('click');
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item')[2].classes()).toContain('is-active');
			expect(wrapper.findAll('.vc-carousel__dot')[2].classes()).toContain('is-active');
			wrapper.unmount();
		});

		it('trigger="hover" mouseenter on dot switches active', async () => {
			const wrapper = mount(() => (
				<Carousel autoplay={false} trigger="hover">
					<CarouselItem />
					<CarouselItem />
					<CarouselItem />
				</Carousel>
			));
			await flushAll();
			const dots = wrapper.findAll('.vc-carousel__dot');
			expect(dots.length).toBe(3);
			await dots[1].trigger('mouseenter');
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item')[1].classes()).toContain('is-active');
			wrapper.unmount();
		});

		it('trigger="click" does NOT switch on hover', async () => {
			const wrapper = mount(() => (
				<Carousel autoplay={false} trigger="click">
					<CarouselItem />
					<CarouselItem />
				</Carousel>
			));
			await flushAll();
			const dots = wrapper.findAll('.vc-carousel__dot');
			expect(dots.length).toBe(2);
			await dots[1].trigger('mouseenter');
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item')[0].classes()).toContain('is-active');
			wrapper.unmount();
		});
	});

	describe('label', () => {
		it('renders label text in dot button', async () => {
			const wrapper = mount(() => (
				<Carousel autoplay={false}>
					<CarouselItem label="A" />
					<CarouselItem label="B" />
					<CarouselItem label="C" />
				</Carousel>
			));
			await flushAll();
			const buttons = wrapper.findAll('.vc-carousel__button');
			expect(buttons.length).toBe(3);
			expect(buttons[0].text()).toBe('A');
			expect(buttons[1].text()).toBe('B');
			expect(wrapper.find('.vc-carousel__dots').classes()).toContain('is-labels');
			wrapper.unmount();
		});

		it('omits label span when no item has a label', async () => {
			const wrapper = mount(() => (
				<Carousel autoplay={false}>
					<CarouselItem />
					<CarouselItem />
				</Carousel>
			));
			await flushAll();
			expect(wrapper.find('.vc-carousel__button span').exists()).toBe(false);
			expect(wrapper.find('.vc-carousel__dots').classes()).not.toContain('is-labels');
			wrapper.unmount();
		});

		it('keeps dot order in sync when items are inserted dynamically', async () => {
			const data = reactive<number[]>([1, 2, 3, 4]);
			const wrapper = mount({
				setup() {
					return () => (
						<Carousel autoplay={false}>
							{data.map(v => (
								<CarouselItem key={v} label={v}>{v}</CarouselItem>
							))}
						</Carousel>
					);
				}
			});
			await flushAll();
			expect(wrapper.findAll('.vc-carousel__button').length).toBe(4);

			data.splice(1, 0, 5);
			await flushAll();
			await flushAll();

			const buttons = wrapper.findAll('.vc-carousel__button');
			expect(buttons.length).toBe(5);
			data.forEach((v, i) => {
				expect(buttons[i].text()).toBe(String(v));
			});
			wrapper.unmount();
		});
	});

	describe('arrow', () => {
		it('renders arrow buttons by default (hover mode)', async () => {
			const wrapper = mount(() => (
				<Carousel autoplay={false}>
					<CarouselItem />
					<CarouselItem />
				</Carousel>
			));
			await flushAll();
			expect(wrapper.find('.vc-carousel__arrow.is-left-arrow').exists()).toBe(true);
			expect(wrapper.find('.vc-carousel__arrow.is-right-arrow').exists()).toBe(true);
			wrapper.unmount();
		});

		it('arrow=false hides arrows', async () => {
			const wrapper = mount(() => (
				<Carousel autoplay={false} arrow={false}>
					<CarouselItem />
					<CarouselItem />
				</Carousel>
			));
			await flushAll();
			expect(wrapper.find('.vc-carousel__arrow').exists()).toBe(false);
			wrapper.unmount();
		});

		it('vertical=true hides arrows even when arrow prop is set', async () => {
			const wrapper = mount(() => (
				<Carousel autoplay={false} vertical arrow="always">
					<CarouselItem />
					<CarouselItem />
				</Carousel>
			));
			await flushAll();
			expect(wrapper.find('.vc-carousel__arrow').exists()).toBe(false);
			wrapper.unmount();
		});

		it('right arrow click goes to next item', async () => {
			const wrapper = mount(() => (
				<Carousel autoplay={false} arrow="always">
					<CarouselItem />
					<CarouselItem />
					<CarouselItem />
				</Carousel>
			));
			await flushAll();
			await wrapper.find('.vc-carousel__arrow.is-right-arrow').trigger('click');
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item')[1].classes()).toContain('is-active');
			wrapper.unmount();
		});

		it('left arrow click goes to previous item', async () => {
			const wrapper = mount(() => (
				<Carousel autoplay={false} arrow="always" initialIndex={2}>
					<CarouselItem />
					<CarouselItem />
					<CarouselItem />
				</Carousel>
			));
			await flushAll();
			await wrapper.find('.vc-carousel__arrow.is-left-arrow').trigger('click');
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item')[1].classes()).toContain('is-active');
			wrapper.unmount();
		});

		it('hovering arrow buttons does not throw', async () => {
			const wrapper = mount(() => (
				<Carousel autoplay={false} arrow="always">
					<CarouselItem />
					<CarouselItem />
					<CarouselItem />
				</Carousel>
			), { attachTo: document.body });
			await flushAll();

			const left = wrapper.find('.vc-carousel__arrow.is-left-arrow').element as HTMLElement;
			fireMouse(left, 'mouseenter');
			await flushAll();
			fireMouse(left, 'mouseleave');
			await flushAll();
			expect(wrapper.find('.vc-carousel__arrow.is-left-arrow').exists()).toBe(true);
			wrapper.unmount();
		});

		it('card mode arrow hover marks neighbor items as hovered', async () => {
			const wrapper = mount(() => (
				<Carousel autoplay={false} card arrow="always">
					<CarouselItem />
					<CarouselItem />
					<CarouselItem />
				</Carousel>
			), { attachTo: document.body });
			restoreSize = mockOffsetSize(wrapper.element as HTMLElement);
			await flushAll();

			const right = wrapper.find('.vc-carousel__arrow.is-right-arrow').element as HTMLElement;
			fireMouse(right, 'mouseenter');
			await flushAll();
			const left = wrapper.find('.vc-carousel__arrow.is-left-arrow').element as HTMLElement;
			fireMouse(left, 'mouseenter');
			await flushAll();
			// 不抛错且活动项依旧是第 0 项
			expect(wrapper.findAll('.vc-carousel-item')[0].classes()).toContain('is-active');
			wrapper.unmount();
		});
	});

	describe('exposed methods', () => {
		const setup = () => {
			const carouselRef = ref<any>(null);
			const wrapper = mount({
				setup() {
					return () => (
						<Carousel ref={carouselRef} autoplay={false}>
							<CarouselItem name="a" />
							<CarouselItem name="b" />
							<CarouselItem name="c" />
						</Carousel>
					);
				}
			});
			return { wrapper, carouselRef };
		};

		it('setActiveItem(index) jumps to index', async () => {
			const { wrapper, carouselRef } = setup();
			await flushAll();

			carouselRef.value.setActiveItem(2);
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item')[2].classes()).toContain('is-active');
			wrapper.unmount();
		});

		it('setActiveItem(name) jumps by item name', async () => {
			const { wrapper, carouselRef } = setup();
			await flushAll();

			carouselRef.value.setActiveItem('b');
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item')[1].classes()).toContain('is-active');
			wrapper.unmount();
		});

		it('setActiveItem with non-integer throws', async () => {
			const { wrapper, carouselRef } = setup();
			await flushAll();

			expect(() => carouselRef.value.setActiveItem(1.5)).toThrow();
			expect(() => carouselRef.value.setActiveItem('not-exist')).toThrow();
			wrapper.unmount();
		});

		it('prev/next navigate active item with loop', async () => {
			const { wrapper, carouselRef } = setup();
			await flushAll();

			carouselRef.value.next();
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item')[1].classes()).toContain('is-active');

			carouselRef.value.prev();
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item')[0].classes()).toContain('is-active');

			carouselRef.value.prev();
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item')[2].classes()).toContain('is-active');

			carouselRef.value.next();
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item')[0].classes()).toContain('is-active');

			wrapper.unmount();
		});

		it('loop=false stops at boundaries', async () => {
			const carouselRef = ref<any>(null);
			const wrapper = mount({
				setup() {
					return () => (
						<Carousel ref={carouselRef} autoplay={false} loop={false}>
							<CarouselItem />
							<CarouselItem />
							<CarouselItem />
						</Carousel>
					);
				}
			});
			await flushAll();

			carouselRef.value.prev();
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item')[0].classes()).toContain('is-active');

			carouselRef.value.setActiveItem(2);
			await flushAll();
			carouselRef.value.next();
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item')[2].classes()).toContain('is-active');

			wrapper.unmount();
		});

		it('two items: next/prev navigate between exactly two items', async () => {
			const carouselRef = ref<any>(null);
			const wrapper = mount({
				setup() {
					return () => (
						<Carousel ref={carouselRef} autoplay={false}>
							<CarouselItem />
							<CarouselItem />
						</Carousel>
					);
				}
			});
			await flushAll();

			expect(wrapper.findAll('.vc-carousel-item')[0].classes()).toContain('is-active');
			carouselRef.value.next();
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item')[1].classes()).toContain('is-active');
			carouselRef.value.next();
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item')[0].classes()).toContain('is-active');
			carouselRef.value.prev();
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item')[1].classes()).toContain('is-active');
			wrapper.unmount();
		});

		it('loop watcher calls setActiveItem when toggled', async () => {
			const loop = ref(true);
			const carouselRef = ref<any>(null);
			const wrapper = mount({
				setup() {
					return () => (
						<Carousel ref={carouselRef} autoplay={false} loop={loop.value}>
							<CarouselItem />
							<CarouselItem />
							<CarouselItem />
						</Carousel>
					);
				}
			});
			await flushAll();
			carouselRef.value.setActiveItem(2);
			await flushAll();

			loop.value = false;
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item')[2].classes()).toContain('is-active');
			wrapper.unmount();
		});
	});

	describe('card mode', () => {
		const mountCard = (count = 5) => {
			const wrapper = mount(() => (
				<Carousel autoplay={false} card>
					{Array.from({ length: count }).map((_, i) => (
						<CarouselItem key={i} />
					))}
				</Carousel>
			), { attachTo: document.body });
			restoreSize = mockOffsetSize(wrapper.element as HTMLElement);
			return wrapper;
		};

		it('card mode applies is-card class to items', async () => {
			const wrapper = mountCard();
			await flushAll();
			const items = wrapper.findAll('.vc-carousel-item');
			expect(items[0].classes()).toContain('is-card');
			wrapper.unmount();
		});

		it('card mode + dots gets is-outside', async () => {
			const wrapper = mountCard(3);
			await flushAll();
			expect(wrapper.find('.vc-carousel__dots').classes()).toContain('is-outside');
			wrapper.unmount();
		});

		it('card mode click on non-active item activates it', async () => {
			const wrapper = mountCard(5);
			await flushAll();

			const items = wrapper.findAll('.vc-carousel-item');
			expect(items[0].classes()).toContain('is-active');

			await items[1].trigger('click');
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item')[1].classes()).toContain('is-active');
			wrapper.unmount();
		});

		it('card mode renders mask on non-active items', async () => {
			const wrapper = mountCard(3);
			await flushAll();

			expect(wrapper.findAll('.vc-carousel-item__mask').length).toBeGreaterThan(0);
			wrapper.unmount();
		});

		it('card mode active item uses scale(1) and others scale<1', async () => {
			const wrapper = mountCard(3);
			await flushAll();

			const items = wrapper.findAll('.vc-carousel-item');
			const activeStyle = items[0].element.getAttribute('style') || '';
			expect(activeStyle).toMatch(/scale\(1\)/);
			wrapper.unmount();
		});

		it('card mode + vertical throws on resetItems', async () => {
			const carouselRef = ref<any>(null);
			const vertical = ref(false);
			const wrapper = mount({
				setup() {
					return () => (
						<Carousel
							ref={carouselRef}
							autoplay={false}
							card
							vertical={vertical.value}
						>
							<CarouselItem />
							<CarouselItem />
							<CarouselItem />
						</Carousel>
					);
				}
			}, { attachTo: document.body });
			restoreSize = mockOffsetSize(wrapper.element as HTMLElement);
			await flushAll();

			vertical.value = true;
			await flushAll();
			// 设置同值会同步调用 resetItems，触发卡片模式下垂直方向的抛错
			expect(() => {
				carouselRef.value.setActiveItem(0);
			}).toThrow();
			wrapper.unmount();
		});
	});

	describe('slide gutter mode', () => {
		it('throws when loop=true and gutter is set on item', () => {
			expect(() => mount(() => (
				<Carousel autoplay={false} loop>
					<CarouselItem gutter={20} width="80%" />
					<CarouselItem gutter={20} width="80%" />
				</Carousel>
			))).toThrow();
		});

		it('renders fine with loop=false + gutter', async () => {
			const wrapper = mount(() => (
				<Carousel autoplay={false} loop={false}>
					<CarouselItem gutter={20} width="80%" />
					<CarouselItem gutter={20} width="80%" />
					<CarouselItem gutter={20} width="80%" />
				</Carousel>
			), { attachTo: document.body });
			restoreSize = mockOffsetSize(wrapper.element as HTMLElement);
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item').length).toBe(3);
			wrapper.unmount();
		});

		it('navigating through start/middle/end with gutter does not throw', async () => {
			const carouselRef = ref<any>(null);
			const wrapper = mount({
				setup() {
					return () => (
						<Carousel ref={carouselRef} autoplay={false} loop={false}>
							<CarouselItem gutter={20} width="80%" />
							<CarouselItem gutter={20} width="80%" />
							<CarouselItem gutter={20} width="80%" />
						</Carousel>
					);
				}
			}, { attachTo: document.body });
			restoreSize = mockOffsetSize(wrapper.element as HTMLElement);
			await flushAll();

			carouselRef.value.setActiveItem(1); // 中间，触发 -1 / 1 偏移分支
			await flushAll();
			carouselRef.value.setActiveItem(2); // 尾，触发 length-1 分支
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item')[2].classes()).toContain('is-active');
			wrapper.unmount();
		});

		it('single-item slide gutter centers the item', async () => {
			const wrapper = mount(() => (
				<Carousel autoplay={false} loop={false}>
					<CarouselItem gutter={10} width="80%" />
				</Carousel>
			), { attachTo: document.body });
			restoreSize = mockOffsetSize(wrapper.element as HTMLElement);
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item').length).toBe(1);
			wrapper.unmount();
		});
	});

	describe('vertical', () => {
		it('vertical adds is-vertical and translates Y', async () => {
			const wrapper = mount(() => (
				<Carousel autoplay={false} vertical height={200}>
					<CarouselItem />
					<CarouselItem />
				</Carousel>
			), { attachTo: document.body });
			restoreSize = mockOffsetSize(wrapper.element as HTMLElement, 600, 200);
			await flushAll();
			expect(wrapper.classes()).toContain('is-vertical');
			const items = wrapper.findAll('.vc-carousel-item');
			expect(items[0].element.getAttribute('style') || '').toContain('translateY');
			wrapper.unmount();
		});
	});

	describe('drag', () => {
		it('drag right (offset>5) goes to previous item', async () => {
			const wrapper = mount(() => (
				<Carousel autoplay={false} initialIndex={1} draggable>
					<CarouselItem />
					<CarouselItem />
					<CarouselItem />
				</Carousel>
			), { attachTo: document.body });
			restoreSize = mockOffsetSize(wrapper.element as HTMLElement);
			await flushAll();

			const root = wrapper.element;
			fireMouse(root, 'mousedown', 100, 0);
			fireMouse(root, 'mousemove', 200, 0);
			fireMouse(root, 'mouseup', 200, 0);
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item')[0].classes()).toContain('is-active');
			wrapper.unmount();
		});

		it('drag left (offset>5) goes to next item', async () => {
			const wrapper = mount(() => (
				<Carousel autoplay={false} draggable>
					<CarouselItem />
					<CarouselItem />
					<CarouselItem />
				</Carousel>
			), { attachTo: document.body });
			restoreSize = mockOffsetSize(wrapper.element as HTMLElement);
			await flushAll();

			const root = wrapper.element;
			fireMouse(root, 'mousedown', 200, 0);
			fireMouse(root, 'mousemove', 50, 0);
			fireMouse(root, 'mouseup', 50, 0);
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item')[1].classes()).toContain('is-active');
			wrapper.unmount();
		});

		it('drag below threshold does not change active', async () => {
			const wrapper = mount(() => (
				<Carousel autoplay={false} draggable>
					<CarouselItem />
					<CarouselItem />
					<CarouselItem />
				</Carousel>
			), { attachTo: document.body });
			restoreSize = mockOffsetSize(wrapper.element as HTMLElement);
			await flushAll();

			const root = wrapper.element;
			fireMouse(root, 'mousedown', 100, 0);
			fireMouse(root, 'mousemove', 102, 0);
			fireMouse(root, 'mouseup', 102, 0);
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item')[0].classes()).toContain('is-active');
			wrapper.unmount();
		});

		it('draggable=false ignores drag', async () => {
			const wrapper = mount(() => (
				<Carousel autoplay={false} draggable={false}>
					<CarouselItem />
					<CarouselItem />
					<CarouselItem />
				</Carousel>
			), { attachTo: document.body });
			restoreSize = mockOffsetSize(wrapper.element as HTMLElement);
			await flushAll();

			const root = wrapper.element;
			fireMouse(root, 'mousedown', 200, 0);
			fireMouse(root, 'mousemove', 50, 0);
			fireMouse(root, 'mouseup', 50, 0);
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item')[0].classes()).toContain('is-active');
			wrapper.unmount();
		});

		it('drag past threshold swallows next click', async () => {
			const innerClick = vi.fn();
			const wrapper = mount(() => (
				<Carousel autoplay={false}>
					<CarouselItem>
						<div class="inner" onClick={innerClick}>inner</div>
					</CarouselItem>
					<CarouselItem />
				</Carousel>
			), { attachTo: document.body });
			restoreSize = mockOffsetSize(wrapper.element as HTMLElement);
			await flushAll();

			const root = wrapper.element;
			fireMouse(root, 'mousedown', 200, 0);
			fireMouse(root, 'mousemove', 50, 0);
			fireMouse(root, 'mouseup', 50, 0);
			await flushAll();

			const inner = wrapper.find('.inner').element;
			inner.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
			await sleep(0);
			expect(innerClick).not.toHaveBeenCalled();
			wrapper.unmount();
		});
	});

	describe('dynamic items', () => {
		it('continues running timer after items added dynamically', async () => {
			useFakeTimers();
			const data = reactive<number[]>([1, 2, 3]);
			const carouselRef = ref<any>(null);
			const wrapper = mount({
				setup() {
					return () => (
						<Carousel ref={carouselRef} t={30}>
							{data.map(v => (
								<CarouselItem key={v} label={v} />
							))}
						</Carousel>
					);
				}
			});

			await flushAll();
			vi.advanceTimersByTime(40);
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item')[1].classes()).toContain('is-active');

			data.push(4);
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item').length).toBe(4);

			vi.advanceTimersByTime(80);
			await flushAll();
			// 添加项目后定时器仍然运转，活动项发生过变化
			const activeIndex = wrapper.findAll('.vc-carousel-item')
				.findIndex(it => it.classes().includes('is-active'));
			expect(activeIndex).toBeGreaterThanOrEqual(0);
			wrapper.unmount();
		});

		it('removes item when v-if toggles off', async () => {
			const show = ref(true);
			const wrapper = mount({
				setup() {
					return () => (
						<Carousel autoplay={false}>
							{show.value && <CarouselItem key="x" />}
							<CarouselItem key="y" />
						</Carousel>
					);
				}
			});
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item').length).toBe(2);

			show.value = false;
			await flushAll();
			expect(wrapper.findAll('.vc-carousel-item').length).toBe(1);
			wrapper.unmount();
		});
	});

	describe('lifecycle', () => {
		it('cleans up timer on unmount', async () => {
			useFakeTimers();
			const wrapper = mount(() => (
				<Carousel t={30}>
					<CarouselItem />
					<CarouselItem />
				</Carousel>
			));
			await flushAll();
			wrapper.unmount();
			expect(() => vi.advanceTimersByTime(500)).not.toThrow();
		});
	});

	// =============================================================
	//               Mobile MCarousel / MCarouselItem
	// =============================================================
	describe('MCarousel basics', () => {
		it('renders root class', async () => {
			const wrapper = mount(() => (
				<MCarousel autoplay={false}>
					<MCarouselItem />
					<MCarouselItem />
				</MCarousel>
			));
			await flushAll();
			expect(wrapper.classes()).toContain('vcm-carousel');
			expect(wrapper.findAll('.vcm-carousel-item').length).toBe(2);
			wrapper.unmount();
		});

		it('indicator shows "current / total" by default', async () => {
			const wrapper = mount(() => (
				<MCarousel autoplay={false}>
					<MCarouselItem />
					<MCarouselItem />
					<MCarouselItem />
				</MCarousel>
			));
			await flushAll();
			const indicator = wrapper.find('.vcm-carousel__indicator');
			expect(indicator.exists()).toBe(true);
			expect(indicator.text().replace(/\s+/g, '')).toBe('1/3');
			wrapper.unmount();
		});

		it('indicator=false hides indicator', async () => {
			const wrapper = mount(() => (
				<MCarousel autoplay={false} indicator={false}>
					<MCarouselItem />
					<MCarouselItem />
				</MCarousel>
			));
			await flushAll();
			expect(wrapper.find('.vcm-carousel__indicator').exists()).toBe(false);
			wrapper.unmount();
		});

		it('card mode hides indicator', async () => {
			const wrapper = mount(() => (
				<MCarousel autoplay={false} card>
					<MCarouselItem />
					<MCarouselItem />
				</MCarousel>
			), { attachTo: document.body });
			restoreSize = mockOffsetSize(wrapper.element as HTMLElement);
			await flushAll();
			expect(wrapper.find('.vcm-carousel__indicator').exists()).toBe(false);
			wrapper.unmount();
		});

		it('dots default off, can be turned on with "bottom"', async () => {
			const wrapperA = mount(() => (
				<MCarousel autoplay={false}>
					<MCarouselItem />
					<MCarouselItem />
				</MCarousel>
			));
			await flushAll();
			expect(wrapperA.find('.vcm-carousel__dots').exists()).toBe(false);
			wrapperA.unmount();

			const wrapperB = mount(() => (
				<MCarousel autoplay={false} dots="bottom">
					<MCarouselItem />
					<MCarouselItem />
					<MCarouselItem />
				</MCarousel>
			));
			await flushAll();
			expect(wrapperB.find('.vcm-carousel__dots').exists()).toBe(true);
			expect(wrapperB.findAll('.vcm-carousel__dot').length).toBe(3);
			wrapperB.unmount();
		});

		it('clicking a dot switches active', async () => {
			const wrapper = mount(() => (
				<MCarousel autoplay={false} dots="bottom">
					<MCarouselItem />
					<MCarouselItem />
					<MCarouselItem />
				</MCarousel>
			));
			await flushAll();
			const dots = wrapper.findAll('.vcm-carousel__dot');
			expect(dots.length).toBe(3);
			await dots[2].trigger('click');
			await flushAll();
			expect(wrapper.findAll('.vcm-carousel-item')[2].classes()).toContain('is-active');
			expect(wrapper.findAll('.vcm-carousel__dot')[2].classes()).toContain('is-active');
			wrapper.unmount();
		});

		it('label displays inside dot button', async () => {
			const wrapper = mount(() => (
				<MCarousel autoplay={false} dots="bottom">
					<MCarouselItem label="X" />
					<MCarouselItem label="Y" />
				</MCarousel>
			));
			await flushAll();
			const buttons = wrapper.findAll('.vcm-carousel__button');
			expect(buttons.length).toBe(2);
			expect(buttons[0].text()).toBe('X');
			expect(buttons[1].text()).toBe('Y');
			wrapper.unmount();
		});

		it('horizontal touch drag (left) moves to next', async () => {
			const wrapper = mount(() => (
				<MCarousel autoplay={false}>
					<MCarouselItem />
					<MCarouselItem />
					<MCarouselItem />
				</MCarousel>
			), { attachTo: document.body });
			restoreSize = mockOffsetSize(wrapper.element as HTMLElement);
			await flushAll();

			const root = wrapper.element;
			fireTouch(root, 'touchstart', 200, 100);
			fireTouch(root, 'touchmove', 50, 110);
			fireTouch(root, 'touchend', 50, 110);
			await flushAll();
			expect(wrapper.findAll('.vcm-carousel-item')[1].classes()).toContain('is-active');
			wrapper.unmount();
		});

		it('vertical touch drag uses Y direction', async () => {
			const wrapper = mount(() => (
				<MCarousel autoplay={false} vertical height={200}>
					<MCarouselItem />
					<MCarouselItem />
				</MCarousel>
			), { attachTo: document.body });
			restoreSize = mockOffsetSize(wrapper.element as HTMLElement, 600, 200);
			await flushAll();

			const root = wrapper.element;
			fireTouch(root, 'touchstart', 100, 200);
			fireTouch(root, 'touchmove', 100, 50);
			fireTouch(root, 'touchend', 100, 50);
			await flushAll();
			expect(wrapper.findAll('.vcm-carousel-item')[1].classes()).toContain('is-active');
			wrapper.unmount();
		});

		it('horizontal scroll-direction touch is treated as scroll, not swipe', async () => {
			const wrapper = mount(() => (
				<MCarousel autoplay={false}>
					<MCarouselItem />
					<MCarouselItem />
				</MCarousel>
			), { attachTo: document.body });
			restoreSize = mockOffsetSize(wrapper.element as HTMLElement);
			await flushAll();

			const root = wrapper.element;
			fireTouch(root, 'touchstart', 100, 100);
			// Y 移动多于 X，认为是垂直滚动
			fireTouch(root, 'touchmove', 105, 200);
			fireTouch(root, 'touchend', 105, 200);
			await flushAll();
			expect(wrapper.findAll('.vcm-carousel-item')[0].classes()).toContain('is-active');
			wrapper.unmount();
		});

		it('exposes setActiveItem/prev/next', async () => {
			const carouselRef = ref<any>(null);
			const wrapper = mount({
				setup() {
					return () => (
						<MCarousel ref={carouselRef} autoplay={false}>
							<MCarouselItem />
							<MCarouselItem />
							<MCarouselItem />
						</MCarousel>
					);
				}
			});
			await flushAll();

			carouselRef.value.next();
			await flushAll();
			expect(wrapper.findAll('.vcm-carousel-item')[1].classes()).toContain('is-active');

			carouselRef.value.setActiveItem(2);
			await flushAll();
			expect(wrapper.findAll('.vcm-carousel-item')[2].classes()).toContain('is-active');

			carouselRef.value.prev();
			await flushAll();
			expect(wrapper.findAll('.vcm-carousel-item')[1].classes()).toContain('is-active');
			wrapper.unmount();
		});
	});
});
