// @vitest-environment jsdom

import { Popup, MPopup } from '@deot/vc-components';
import { mount, config } from '@vue/test-utils';
import { Utils } from '@deot/dev-test';
import { nextTick, ref } from 'vue';
import { vi } from 'vitest';
import { fireTouch } from '../../../hooks/__tests__/fixtures/drag';
import { resolveHeights, pickSnap } from '../mobile/use-popup-snaps';

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

	it('#header 插槽与只有 closable 时也有 .vcm-popup__title，关闭按钮在右侧', async () => {
		const wrapper = mount(() => (
			<div>
				<MPopup modelValue closable class="only-close" />
				<MPopup modelValue closable class="slot-header" v-slots={{ header: () => <b>自定义</b> }} />
			</div>
		), { attachTo: document.body });
		await flush();
		expect(wrapper.find('.only-close .vcm-popup__header > .vcm-popup__title').exists()).toBe(true);
		expect(wrapper.find('.slot-header .vcm-popup__title > b').text()).toBe('自定义');
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

	it('拖动事件（没有 snaps）：打开为 0，向关闭方向为负', async () => {
		const visible = ref(true);
		const onDrag = vi.fn();
		const onDragend = vi.fn();
		const wrapper = mount(() => (
			<MPopup v-model={visible.value} onDrag={onDrag} onDragend={onDragend}><div class="body">x</div></MPopup>
		), { attachTo: document.body });
		await flush();
		const panel = visibleWrapper()!;
		sizeOf(panel, 375, 400);

		fireTouch(panel, 'touchstart', { clientX: 100, clientY: 100 });
		fireTouch(panel, 'touchmove', { clientX: 100, clientY: 140 });
		fireTouch(panel, 'touchmove', { clientX: 100, clientY: 120 });
		expect(onDrag).toHaveBeenLastCalledWith({ snap: 0, height: 380, offset: 20, progress: -0.05, direction: 'up', velocity: expect.any(Number) });
		// 慢速松手：回弹，速度按静止处理
		await Utils.sleep(150);
		fireTouch(panel, 'touchend', { clientX: 100, clientY: 120 });
		expect(onDragend).toHaveBeenLastCalledWith({ snap: 0, close: false, progress: 0, velocity: 0 });
		await flushLeave();
		expect(visible.value).toBe(true);
		wrapper.unmount();
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

describe('snaps', () => {
	// jsdom 不做布局：可用高度 800；百分比按可用高度换算；数字（750 稿）按 --vc-rem = 0.5；内容区内容高 content
	let content = 2000;
	const restore: Array<() => void> = [];
	beforeEach(() => {
		content = 2000;
		const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')!;
		Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
			configurable: true,
			get(this: HTMLElement) {
				const height = this.style.height;
				const gap = /^calc\(100% - ([\d.]+)px\)$/.exec(height);
				if (gap) return 800 - Number(gap[1]);
				if (height.endsWith('%')) return 800 * parseFloat(height) / 100;
				const rem = /var\(--vc-rem\) \* ([\d.]+)/.exec(height);
				if (rem) return Number(rem[1]) * 0.5;
				if (this.classList.contains('vcm-popup__content')) return content;
				return 0;
			}
		});
		restore.push(() => Object.defineProperty(HTMLElement.prototype, 'offsetHeight', descriptor));
	});
	afterEach(() => {
		restore.splice(0).forEach(fn => fn());
		document.body.innerHTML = '';
		document.body.style.removeProperty('overflow');
	});

	const mountSnaps = async (props: Record<string, any> = {}) => {
		const visible = ref(true);
		const snap = ref(props.snap ?? 0);
		const onSnap = vi.fn((v: number) => (snap.value = v));
		const wrapper = mount(() => (
			<MPopup
				v-model={visible.value}
				snaps={['50%', '100%']}
				title="标题"
				{...props}
				snap={snap.value}
				onUpdate:snap={onSnap}
				v-slots={{ default: () => <div class="body">x</div>, footer: props.footer ? () => <span>底部</span> : undefined }}
			/>
		), { attachTo: document.body });
		await flush();
		const panel = visibleWrapper()!;
		return { wrapper, visible, snap, onSnap, panel };
	};

	it('resolveHeights：不超过内容与可用高度，与 snaps 一一对应', () => {
		expect(resolveHeights([400, 800], 2000, 760)).toEqual([400, 760]);
		expect(resolveHeights([400, 800], 300, 760)).toEqual([300, 300]);
	});

	it('pickSnap：取最近的一档，相同取较低的一档', () => {
		expect(pickSnap([400, 0], 150)).toBe(1);
		expect(pickSnap([400, 0], 250)).toBe(0);
		expect(pickSnap([400, 0], 200)).toBe(0);
	});

	it('打开时：面板为最高档的高度，按 snap 档放到屏幕外；指示器；不在最高档时锁定内容区', async () => {
		const { wrapper, panel } = await mountSnaps();

		expect(panel.classList.contains('is-snapped')).toBe(true);
		expect(panel.style.height).toBe('800px');
		expect(panel.style.bottom).toBe('-400px');
		expect(panel.firstElementChild!.classList.contains('vcm-popup__handle')).toBe(true);
		expect(wrapper.find('.vcm-popup__scroller').classes()).toContain('is-locked');
		wrapper.unmount();
	});

	it('上拉到最高档：跟手只写 transform，松手后吸附并发出 update:snap', async () => {
		const { wrapper, panel, onSnap } = await mountSnaps();

		fireTouch(panel, 'touchstart', { clientX: 100, clientY: 500 });
		const move = fireTouch(panel, 'touchmove', { clientX: 100, clientY: 200 });
		expect(move.defaultPrevented).toBe(true);
		expect(panel.style.transform).toBe('translateY(-300px)');
		expect(panel.style.bottom).toBe('-400px');
		fireTouch(panel, 'touchend', { clientX: 100, clientY: 200 });

		await flush(400);
		expect(panel.style.bottom).toBe('0px');
		expect(panel.style.transform).toBe('');
		expect(onSnap).toHaveBeenLastCalledWith(1);
		expect(wrapper.find('.vcm-popup__scroller').classes()).not.toContain('is-locked');
		wrapper.unmount();
	});

	it('在最高档：内容能滚时交给滚动，滚到顶后下拉回到低档', async () => {
		const { wrapper, panel, onSnap } = await mountSnaps({ snap: 1 });
		const scroller = wrapper.find('.vcm-popup__scroller').element as HTMLElement;
		const body = panel.querySelector<HTMLElement>('.body')!;
		scroller.style.overflowY = 'auto';
		Object.defineProperty(scroller, 'scrollHeight', { configurable: true, value: 2000 });
		Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: 700 });

		// 上拉：滚动内容
		const [up] = swipe(body, [100, 500], [100, 200]);
		expect(up.defaultPrevented).toBe(false);
		expect(panel.style.transform).toBe('');

		// 已滚动时下拉：交给滚动
		scroller.scrollTop = 300;
		const [down] = swipe(body, [100, 200], [100, 500]);
		expect(down.defaultPrevented).toBe(false);

		// 滚到顶后下拉：回到低档
		scroller.scrollTop = 0;
		swipe(body, [100, 200], [100, 500]);
		await flush(400);
		expect(panel.style.bottom).toBe('-400px');
		expect(onSnap).toHaveBeenLastCalledWith(0);
		wrapper.unmount();
	});

	it('低于最低档：默认关闭；swipeClosable 为 false 时回弹', async () => {
		const first = await mountSnaps({ swipeClosable: false });
		swipe(first.panel, [100, 500], [100, 750]);
		await flush(400);
		expect(first.visible.value).toBe(true);
		expect(first.panel.style.bottom).toBe('-400px');
		first.wrapper.unmount();

		const second = await mountSnaps();
		swipe(second.panel, [100, 500], [100, 750]);
		await flushLeave();
		expect(second.visible.value).toBe(false);
		second.wrapper.unmount();
	});

	it('点击指示器切到下一档，到顶后回到最低档；外部修改 snap 时过渡到该档', async () => {
		const { wrapper, panel, snap } = await mountSnaps();

		await wrapper.find('.vcm-popup__handle').trigger('click');
		await flush(400);
		expect(panel.style.bottom).toBe('0px');
		expect(snap.value).toBe(1);

		await wrapper.find('.vcm-popup__handle').trigger('click');
		await flush(400);
		expect(panel.style.bottom).toBe('-400px');
		expect(snap.value).toBe(0);

		snap.value = 1;
		await flush(400);
		expect(panel.style.bottom).toBe('0px');
		wrapper.unmount();
	});

	it('footer 在各档都贴住屏幕底边', async () => {
		const { wrapper, panel } = await mountSnaps({ footer: true });
		const footer = panel.querySelector<HTMLElement>('.vcm-popup__footer')!;
		expect(footer.style.transform).toBe('translateY(-400px)');

		await wrapper.find('.vcm-popup__handle').trigger('click');
		await flush(400);
		expect(footer.style.transform).toBe('');
		wrapper.unmount();
	});

	it('内容很矮时只有一档，不锁定内容区', async () => {
		content = 100;
		const { wrapper, panel } = await mountSnaps();

		expect(panel.style.bottom).toBe('0px');
		expect(wrapper.find('.vcm-popup__scroller').classes()).not.toContain('is-locked');
		wrapper.unmount();
	});

	it('指示器：拖动时按手指方向倾斜（is-up / is-down），松手后复原', async () => {
		const { wrapper, panel } = await mountSnaps();
		const handle = panel.querySelector<HTMLElement>('.vcm-popup__handle')!;
		expect(handle.querySelector('.vcm-popup__indicator')).toBeTruthy();

		fireTouch(panel, 'touchstart', { clientX: 100, clientY: 500 });
		fireTouch(panel, 'touchmove', { clientX: 100, clientY: 400 });
		expect(handle.classList.contains('is-up')).toBe(true);
		fireTouch(panel, 'touchmove', { clientX: 100, clientY: 420 });
		expect(handle.classList.contains('is-down')).toBe(true);
		expect(handle.classList.contains('is-up')).toBe(false);
		fireTouch(panel, 'touchend', { clientX: 100, clientY: 420 });
		expect(handle.classList.contains('is-down')).toBe(false);
		await flush(400);
		wrapper.unmount();
	});

	it('100% 为视口高度（全屏），留白用 calc', async () => {
		// 探针容器高 100%（mock 为 800）
		const { wrapper, panel } = await mountSnaps({ snaps: ['50%', '100%'], snap: 1 });
		expect(panel.style.height).toBe('800px');
		expect(panel.style.bottom).toBe('0px');
		wrapper.unmount();
	});

	it('铺满视口时 is-full（圆角打平），拖离顶部即恢复；留白的最高档不加', async () => {
		const { wrapper, panel, snap } = await mountSnaps({ snaps: ['50%', '100%'], snap: 1 });
		expect(panel.classList.contains('is-full')).toBe(true);

		fireTouch(panel, 'touchstart', { clientX: 100, clientY: 100 });
		fireTouch(panel, 'touchmove', { clientX: 100, clientY: 140 });
		await nextTick();
		expect(panel.classList.contains('is-full')).toBe(false);
		fireTouch(panel, 'touchmove', { clientX: 100, clientY: 100 });
		await nextTick();
		expect(panel.classList.contains('is-full')).toBe(true);
		fireTouch(panel, 'touchend', { clientX: 100, clientY: 100 });
		await flush(400);

		// 外部切到低档：过渡开始即恢复圆角
		snap.value = 0;
		await nextTick();
		expect(panel.classList.contains('is-full')).toBe(false);
		await flush(400);
		wrapper.unmount();

		const gap = await mountSnaps({ snaps: ['50%', 'calc(100% - 40px)'], snap: 1 });
		expect(gap.panel.style.height).toBe('760px');
		expect(gap.panel.classList.contains('is-full')).toBe(false);
		gap.wrapper.unmount();
	});

	it('#handle 插槽替换横条；contentClass / contentStyle 作用于内容区', async () => {
		const wrapper = mount(() => (
			<MPopup
				modelValue
				snaps={['50%', '100%']}
				title="标题"
				contentClass="custom-content"
				contentStyle={{ color: 'red' }}
				v-slots={{ handle: () => <span class="custom-handle">更多</span>, default: () => 'x' }}
			/>
		), { attachTo: document.body });
		await flush();

		expect(wrapper.find('.vcm-popup__handle .custom-handle').exists()).toBe(true);
		expect(wrapper.find('.vcm-popup__indicator').exists()).toBe(false);
		const contentEl = wrapper.find('.vcm-popup__content');
		expect(contentEl.classes()).toContain('custom-content');
		expect((contentEl.element as HTMLElement).style.color).toBe('red');
		wrapper.unmount();

		const plain = mount(() => (<MPopup modelValue content="x" scrollable={false} contentClass="plain" />), { attachTo: document.body });
		await flush();
		expect(plain.find('.vcm-popup__content').classes()).toContain('plain');
		plain.unmount();
	});

	it('handle 为 false 时不显示指示器；不设置 snaps 时不加档位样式', async () => {
		const { wrapper } = await mountSnaps({ handle: false });
		expect(wrapper.find('.vcm-popup__handle').exists()).toBe(false);
		wrapper.unmount();

		const plain = mount(() => (<MPopup modelValue title="标题" />), { attachTo: document.body });
		await flush();
		const panel = visibleWrapper()!;
		expect(panel.classList.contains('is-snapped')).toBe(false);
		expect(panel.style.height).toBe('');
		plain.unmount();
	});

	it('拖动事件：dragstart / drag / dragend 的参数（多档）', async () => {
		const events: Array<[string, any]> = [];
		const { wrapper, panel } = await mountSnaps({
			onDragstart: (e: any) => events.push(['dragstart', e]),
			onDrag: (e: any) => events.push(['drag', e]),
			onDragend: (e: any) => events.push(['dragend', e])
		});

		// 最低档 400、最高档 800：上拉 300 后露出 700，进度 (400 - 100) / 400
		fireTouch(panel, 'touchstart', { clientX: 100, clientY: 500 });
		fireTouch(panel, 'touchmove', { clientX: 100, clientY: 200 });
		expect(events[0]).toEqual(['dragstart', { snap: 0, height: 400 }]);
		expect(events[1][0]).toBe('drag');
		expect(events[1][1]).toMatchObject({ snap: 0, height: 700, offset: -300, progress: 0.75, direction: 'up' });
		fireTouch(panel, 'touchend', { clientX: 100, clientY: 200 });
		expect(events[2][0]).toBe('dragend');
		expect(events[2][1]).toMatchObject({ snap: 1, close: false, progress: 1 });
		await flush(400);

		// 从最高档下拉到最低档以下：进度为负
		events.length = 0;
		fireTouch(panel, 'touchstart', { clientX: 100, clientY: 100 });
		fireTouch(panel, 'touchmove', { clientX: 100, clientY: 700 });
		expect(events[1][1]).toMatchObject({ snap: 1, height: 200, offset: 600, progress: -0.5, direction: 'down' });
		fireTouch(panel, 'touchend', { clientX: 100, clientY: 700 });
		expect(events[2][1]).toMatchObject({ snap: 1, close: true, progress: -1 });
		await flushLeave();
		wrapper.unmount();
	});

	it('插槽参数：snap / full / dragging / close / snapTo；状态变化只更新用到它的插槽', async () => {
		const visible = ref(true);
		let renders = 0;
		const wrapper = mount(() => (
			<MPopup
				v-model={visible.value}
				snaps={['50%', '100%']}
				title="标题"
				v-slots={{
					default: () => {
						renders++;
						return <div class="body">x</div>;
					},
					handle: (e: any) => <span class="handle-slot">{e.dragging ? 'dragging' : 'idle'}</span>,
					footer: (e: any) => (
						<span class="foot" onClick={() => (e.snap ? e.close() : e.snapTo(1))}>
							{`${e.snap}-${e.full}-${e.dragging}`}
						</span>
					)
				}}
			/>
		), { attachTo: document.body });
		await flush();
		const panel = visibleWrapper()!;
		const foot = () => wrapper.find('.foot').text();
		expect(foot()).toBe('0-false-false');

		const before = renders;
		fireTouch(panel, 'touchstart', { clientX: 100, clientY: 500 });
		fireTouch(panel, 'touchmove', { clientX: 100, clientY: 450 });
		await nextTick();
		expect(foot()).toBe('0-false-true');
		expect(wrapper.find('.handle-slot').text()).toBe('dragging');
		// 默认插槽（Popup 自身）没有重新渲染
		expect(renders).toBe(before);
		fireTouch(panel, 'touchend', { clientX: 100, clientY: 450 });
		await flush(400);
		expect(foot()).toBe('0-false-false');

		await wrapper.find('.foot').trigger('click');
		await flush(400);
		expect(foot()).toBe('1-true-false');

		await wrapper.find('.foot').trigger('click');
		await flushLeave();
		expect(visible.value).toBe(false);
		wrapper.unmount();
	});
});
