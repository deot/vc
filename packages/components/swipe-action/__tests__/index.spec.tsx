// @vitest-environment jsdom

import { MSwipeAction, SwipeAction, MTabs, MTabsPane } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { Utils } from '@deot/dev-test';
import { nextTick, ref } from 'vue';
import { vi } from 'vitest';

const flush = async () => {
	await nextTick();
	await Utils.sleep(0);
	await nextTick();
};

// jsdom 没有布局：按钮宽 60，组件宽 300
const offsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')!;
beforeAll(() => {
	Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
		configurable: true,
		get() {
			if (this.classList.contains('vcm-swipe-action__action')) return 60;
			if (this.classList.contains('vcm-swipe-action')) return 300;
			return 0;
		}
	});
});
afterAll(() => {
	Object.defineProperty(HTMLElement.prototype, 'offsetWidth', offsetWidth);
});

// jsdom 没有 Touch：用带 touches / changedTouches 的事件模拟一根手指
const touch = (el: Element, type: string, x: number, y: number) => {
	const point = { identifier: 1, clientX: x, clientY: y, screenX: x, screenY: y, pageX: x, pageY: y };
	const event = new Event(type, { bubbles: true, cancelable: true });
	Object.assign(event, {
		touches: type === 'touchend' ? [] : [point],
		changedTouches: [point]
	});
	el.dispatchEvent(event);
	return event;
};

// hold：松手前停顿，速度按 0 计（不算快速甩动）
const swipe = async (el: Element, dx: number, options: { dy?: number; hold?: boolean } = {}) => {
	const { dy = 0, hold = true } = options;
	touch(el, 'touchstart', 200, 200);
	const move = touch(el, 'touchmove', 200 + dx / 2, 200 + dy / 2);
	touch(el, 'touchmove', 200 + dx, 200 + dy);
	hold && await Utils.sleep(120);
	touch(el, 'touchend', 200 + dx, 200 + dy);
	await flush();
	return move;
};

const getTransform = (wrapper: any) => (wrapper.find('.vcm-swipe-action__track').element as HTMLElement).style.transform;

const actions = () => [
	{ content: '置顶' },
	{ content: '删除', type: 'error' as const }
];

describe('swipe-action', () => {
	it('basic', () => {
		expect(typeof MSwipeAction).toBe('object');
		expect(SwipeAction).toBe(MSwipeAction);
	});

	it('renders actions by side and type', async () => {
		const wrapper = mount(() => (
			<MSwipeAction
				leftActions={[{ content: '已读', type: 'primary', icon: 'success' }]}
				rightActions={[...actions(), { content: '禁用', disabled: true, class: 'custom' }]}
			>
				<p class="content">内容</p>
			</MSwipeAction>
		));
		await flush();

		expect(wrapper.classes()).toContain('vcm-swipe-action');
		const left = wrapper.findAll('.vcm-swipe-action__actions.is-left .vcm-swipe-action__action');
		const right = wrapper.findAll('.vcm-swipe-action__actions.is-right .vcm-swipe-action__action');
		expect(left.length).toBe(1);
		expect(left[0].classes()).toContain('is-primary');
		expect(left[0].find('.vcm-swipe-action__icon').exists()).toBe(true);
		expect(right.map(item => item.text())).toEqual(['置顶', '删除', '禁用']);
		expect(right[0].classes()).toContain('is-default');
		expect(right[1].classes()).toContain('is-error');
		expect(right[2].classes()).toEqual(expect.arrayContaining(['is-disabled', 'custom']));
		// 外侧的叠在上层
		expect(right.map(item => (item.element as HTMLElement).style.zIndex)).toEqual(['1', '2', '3']);
		expect(wrapper.find('.vcm-swipe-action__track .content').exists()).toBe(true);

		// 没有操作项的一侧不渲染
		const empty = mount(() => <MSwipeAction rightActions={actions()}>内容</MSwipeAction>);
		expect(empty.find('.is-left').exists()).toBe(false);
		wrapper.unmount();
		empty.unmount();
	});

	it('opens past the threshold and snaps back below it', async () => {
		const onUpdate = vi.fn();
		const wrapper = mount(() => (
			<MSwipeAction rightActions={actions()} onUpdate:modelValue={onUpdate}>
				<p class="content">内容</p>
			</MSwipeAction>
		), { attachTo: document.body });
		await flush();
		const content = wrapper.find('.content').element;

		// 15px < 120 × 0.15：回弹
		await swipe(content, -15);
		expect(getTransform(wrapper)).toBe('');
		expect(onUpdate).not.toHaveBeenCalled();

		// 40px：展开，按钮总宽 120；横向移动阻止默认行为
		const move = await swipe(content, -40);
		expect(move.defaultPrevented).toBe(true);
		expect(getTransform(wrapper)).toBe('translate3d(-120px, 0, 0)');
		expect(onUpdate).toHaveBeenLastCalledWith('right');
		expect(wrapper.classes()).toContain('is-swiping');
		const panel = wrapper.find('.vcm-swipe-action__actions.is-right').element as HTMLElement;
		expect(panel.style.width).toBe('120px');
		expect(wrapper.findAll('.is-right .vcm-swipe-action__action').map(item => (item.element as HTMLElement).style.left)).toEqual(['0%', '50%']);

		// 展开后往回拖 30px：剩 90 / 120 < 85%，收起
		await swipe(content, 30);
		expect(getTransform(wrapper)).toBe('');
		expect(onUpdate).toHaveBeenLastCalledWith(false);
		wrapper.unmount();
	});

	it('flicks open regardless of distance and damps past the actions', async () => {
		const wrapper = mount(() => (
			<MSwipeAction rightActions={actions()}>
				<p class="content">内容</p>
			</MSwipeAction>
		), { attachTo: document.body });
		await flush();
		const content = wrapper.find('.content').element;

		// 25px 不停顿松手：快速甩动展开
		await swipe(content, -25, { hold: false });
		expect(getTransform(wrapper)).toBe('translate3d(-120px, 0, 0)');

		// 拖动中超出按钮总宽的部分只走 1/4：-120 - 80 → -120 - 20
		touch(content, 'touchstart', 200, 200);
		touch(content, 'touchmove', 180, 200);
		touch(content, 'touchmove', 120, 200);
		await nextTick();
		expect(getTransform(wrapper)).toBe('translate3d(-140px, 0, 0)');
		expect(wrapper.classes()).toContain('is-moving');
		touch(content, 'touchend', 120, 200);
		await flush();
		expect(getTransform(wrapper)).toBe('translate3d(-120px, 0, 0)');
		wrapper.unmount();
	});

	it('continues from the painted position, stops at empty sides and restores on cancel', async () => {
		const open = ref<any>('right');
		const wrapper = mount(() => (
			<MSwipeAction v-model={open.value} rightActions={actions()}>
				<p class="content">内容</p>
			</MSwipeAction>
		), { attachTo: document.body });
		await flush();
		const content = wrapper.find('.content').element;

		// 动画中按下：从画面上的位置（-100）接着拖
		const getComputedStyle = window.getComputedStyle;
		const spy = vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element) => {
			const style = getComputedStyle(el);
			return el.classList.contains('vcm-swipe-action__track')
				? { ...style, transform: 'matrix(1, 0, 0, 1, -100, 0)' } as CSSStyleDeclaration
				: style;
		});
		touch(content, 'touchstart', 200, 200);
		touch(content, 'touchmove', 190, 200);
		touch(content, 'touchmove', 180, 200);
		await nextTick();
		expect(getTransform(wrapper)).toBe('translate3d(-120px, 0, 0)');
		spy.mockRestore();

		// 越过 0 拖到左侧：左侧没有按钮，停在 0
		touch(content, 'touchmove', 400, 200);
		await nextTick();
		expect(getTransform(wrapper)).toBe('');

		// 手势被打断：回到原来的展开状态
		touch(content, 'touchcancel', 400, 200);
		await flush();
		expect(getTransform(wrapper)).toBe('translate3d(-120px, 0, 0)');
		expect(open.value).toBe('right');
		wrapper.unmount();
	});

	it('leaves vertical moves, sides without actions and disabled alone', async () => {
		const wrapper = mount(() => (
			<MSwipeAction rightActions={actions()}>
				<p class="content">内容</p>
			</MSwipeAction>
		), { attachTo: document.body });
		await flush();
		const content = wrapper.find('.content').element;

		expect((await swipe(content, -20, { dy: -80 })).defaultPrevented).toBe(false);
		// 收起时向右滑，左侧没有按钮：不接管（留给外层）
		expect((await swipe(content, 80)).defaultPrevented).toBe(false);
		expect(getTransform(wrapper)).toBe('');
		wrapper.unmount();

		const disabled = mount(() => (
			<MSwipeAction disabled rightActions={actions()}>
				<p class="content">内容</p>
			</MSwipeAction>
		), { attachTo: document.body });
		await swipe(disabled.find('.content').element, -80);
		expect(getTransform(disabled)).toBe('');
		disabled.unmount();
	});

	it('v-model opens and closes from code', async () => {
		const open = ref<any>('left');
		const wrapper = mount(() => (
			<MSwipeAction v-model={open.value} leftActions={[{ content: '已读' }]} rightActions={actions()}>
				内容
			</MSwipeAction>
		), { attachTo: document.body });
		await flush();
		expect(getTransform(wrapper)).toBe('translate3d(60px, 0, 0)');

		open.value = 'right';
		await flush();
		expect(getTransform(wrapper)).toBe('translate3d(-120px, 0, 0)');

		open.value = false;
		await flush();
		expect(getTransform(wrapper)).toBe('');
		wrapper.unmount();
	});

	it('action onClick decides whether to close', async () => {
		const open = ref<any>('right');
		let result: any;
		const onClick = vi.fn(() => result);
		const onContentClick = vi.fn();
		const wrapper = mount(() => (
			<div onClick={onContentClick}>
				<MSwipeAction
					v-model={open.value}
					rightActions={[{ content: '禁用', disabled: true, onClick }, { content: '删除', onClick }]}
				>
					内容
				</MSwipeAction>
			</div>
		), { attachTo: document.body });
		await flush();
		const [disabledButton, button] = wrapper.findAll('.vcm-swipe-action__action');

		await disabledButton.trigger('click');
		expect(onClick).not.toHaveBeenCalled();

		// 真值：保持展开；点击不冒泡到外层
		result = true;
		await button.trigger('click');
		await flush();
		expect(onClick).toHaveBeenCalledTimes(1);
		expect(open.value).toBe('right');
		expect(onContentClick).not.toHaveBeenCalled();

		// reject：保持展开
		result = Promise.reject(new Error('cancel'));
		await button.trigger('click');
		await flush();
		expect(open.value).toBe('right');

		// resolve：结束后收起
		let resolve: any;
		result = new Promise((r) => {
			resolve = r;
		});
		await button.trigger('click');
		await flush();
		expect(open.value).toBe('right');
		resolve();
		await flush();
		expect(open.value).toBe(false);

		// 其余：立即收起
		open.value = 'right';
		await flush();
		result = undefined;
		await button.trigger('click');
		await flush();
		expect(open.value).toBe(false);
		wrapper.unmount();
	});

	it('tapping the content or outside closes it', async () => {
		const open = ref<any>('right');
		const onContentClick = vi.fn();
		const wrapper = mount(() => (
			<MSwipeAction v-model={open.value} rightActions={actions()}>
				<p class="content" onClick={onContentClick}>内容</p>
			</MSwipeAction>
		), { attachTo: document.body });
		await flush();

		// 展开时点内容区：只收起，不触发内容上的点击
		await wrapper.find('.content').trigger('click');
		await flush();
		expect(open.value).toBe(false);
		expect(onContentClick).not.toHaveBeenCalled();

		// 收起后点击照常
		await wrapper.find('.content').trigger('click');
		expect(onContentClick).toHaveBeenCalledTimes(1);

		// 按下外部收起
		open.value = 'right';
		await flush();
		document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
		await flush();
		expect(open.value).toBe(false);
		wrapper.unmount();

		const keep = ref<any>('right');
		const inside = mount(() => (
			<MSwipeAction v-model={keep.value} closeOnClickOutside={false} rightActions={actions()}>
				内容
			</MSwipeAction>
		), { attachTo: document.body });
		await flush();
		document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
		await flush();
		expect(keep.value).toBe('right');
		inside.unmount();
	});

	it('full swipe runs the outermost action after sliding to the end', async () => {
		const onClick = vi.fn();
		const open = ref<any>(false);
		const wrapper = mount(() => (
			<MSwipeAction
				v-model={open.value}
				duration={20}
				rightActions={[{ content: '置顶' }, { content: '删除', fullSwipe: true, onClick }]}
			>
				<p class="content">内容</p>
			</MSwipeAction>
		), { attachTo: document.body });
		await flush();
		const content = wrapper.find('.content').element;

		// 跟手不阻尼，过半（150）进入全滑
		touch(content, 'touchstart', 200, 200);
		touch(content, 'touchmove', 180, 200);
		touch(content, 'touchmove', 20, 200);
		await nextTick();
		expect(getTransform(wrapper)).toBe('translate3d(-180px, 0, 0)');
		const outer = wrapper.findAll('.vcm-swipe-action__action')[1];
		expect(outer.classes()).toContain('is-full');
		expect((outer.element as HTMLElement).style.left).toBe('0px');

		touch(content, 'touchend', 20, 200);
		await flush();
		expect(getTransform(wrapper)).toBe('translate3d(-300px, 0, 0)');
		expect(onClick).not.toHaveBeenCalled();
		await Utils.sleep(40);
		await flush();
		expect(onClick).toHaveBeenCalledTimes(1);
		expect(open.value).toBe(false);
		expect(getTransform(wrapper)).toBe('');

		// 没过半：普通展开
		await swipe(content, -100);
		expect(getTransform(wrapper)).toBe('translate3d(-120px, 0, 0)');
		expect(wrapper.find('.is-full').exists()).toBe(false);
		wrapper.unmount();
	});

	it('does not switch MTabs when it takes the gesture', async () => {
		const value = ref<any>('a');
		const wrapper = mount(() => (
			<MTabs v-model={value.value} swipeable>
				<MTabsPane label="a" value="a">
					<MSwipeAction rightActions={actions()}>
						<p class="content">内容</p>
					</MSwipeAction>
				</MTabsPane>
				<MTabsPane label="b" value="b">B</MTabsPane>
			</MTabs>
		), { attachTo: document.body });
		await flush();

		await swipe(wrapper.find('.content').element, -80);
		expect(value.value).toBe('a');
		expect(getTransform(wrapper)).toBe('translate3d(-120px, 0, 0)');
		wrapper.unmount();
	});
});
