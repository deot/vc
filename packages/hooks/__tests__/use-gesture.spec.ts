// @vitest-environment jsdom

import { h, defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { vi } from 'vitest';
import { useGesture } from '@deot/vc-hooks';
import type { GestureOptions } from '@deot/vc-hooks';

const firePointer = (el: EventTarget, type: string, x: number, y: number, init: PointerEventInit = {}) => {
	const e = new PointerEvent(type, {
		bubbles: true,
		cancelable: true,
		button: 0,
		pointerId: 1,
		pointerType: 'mouse',
		clientX: x,
		clientY: y,
		...init
	});
	el.dispatchEvent(e);
	return e;
};

const fireWheel = (el: EventTarget, init: WheelEventInit) => {
	const e = new WheelEvent('wheel', { bubbles: true, cancelable: true, ...init });
	el.dispatchEvent(e);
	return e;
};

describe('use-gesture.ts', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(0);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	const mountGesture = (options: GestureOptions) => {
		let exposed!: ReturnType<typeof useGesture>;
		const Wrapper = defineComponent(() => {
			exposed = useGesture(options);
			return () => h('div', exposed.listeners, [h('button', { class: 'ignored' })]);
		});
		const root = mount(Wrapper, { attachTo: document.body });
		const el = root.element as HTMLElement;
		el.getBoundingClientRect = () => ({ left: 10, top: 20, width: 300, height: 200 }) as DOMRect;
		return { root, el, gesture: exposed };
	};

	const tapAt = (el: EventTarget, x: number, y: number, init: PointerEventInit = {}) => {
		firePointer(el, 'pointerdown', x, y, init);
		firePointer(el, 'pointerup', x, y, init);
	};

	it('taps with coordinates relative to the element and the target pressed down', () => {
		const tap = vi.fn();
		const { root, el } = mountGesture({ tap });
		const child = el.querySelector('button')!;

		const down = firePointer(child, 'pointerdown', 30, 40);
		// 被捕获后 pointerup 派发到绑定元素
		firePointer(el, 'pointerup', 31, 41);
		expect(tap).toHaveBeenCalledWith(expect.objectContaining({ x: 20, y: 20, pointerType: 'mouse', target: child }));
		expect(down.defaultPrevented).toBe(false);

		// 只认主键
		tapAt(el, 30, 40, { button: 2 });
		expect(tap).toHaveBeenCalledTimes(1);
		root.unmount();
	});

	it('delays touch taps when double tap is listened and fires mouse taps immediately', () => {
		const tap = vi.fn();
		const doubleTap = vi.fn();
		const { root, el } = mountGesture({ tap, doubleTap });
		const touch = { pointerType: 'touch' as const };

		tapAt(el, 30, 40, touch);
		vi.advanceTimersByTime(100);
		tapAt(el, 35, 45, touch);
		expect(doubleTap).toHaveBeenCalledTimes(1);
		vi.advanceTimersByTime(400);
		expect(tap).not.toHaveBeenCalled();

		tapAt(el, 30, 40, touch);
		expect(tap).not.toHaveBeenCalled();
		vi.advanceTimersByTime(300);
		expect(tap).toHaveBeenCalledTimes(1);

		// 相距太远的两次点按各算一次
		tapAt(el, 30, 40, touch);
		vi.advanceTimersByTime(100);
		tapAt(el, 200, 40, touch);
		vi.advanceTimersByTime(300);
		expect(tap).toHaveBeenCalledTimes(3);
		expect(doubleTap).toHaveBeenCalledTimes(1);

		// 鼠标单击不等待，也不算双击
		tapAt(el, 30, 40);
		tapAt(el, 32, 40);
		expect(tap).toHaveBeenCalledTimes(5);
		expect(doubleTap).toHaveBeenCalledTimes(1);
		root.unmount();
	});

	it('fires a touch tap immediately when immediateTap allows it', () => {
		const tap = vi.fn();
		const doubleTap = vi.fn();
		const { root, el } = mountGesture({
			tap,
			doubleTap,
			immediateTap: e => e.target === el
		});
		const touch = { pointerType: 'touch' as const };
		const child = el.querySelector('button')!;

		tapAt(el, 30, 40, touch);
		expect(tap).toHaveBeenCalledTimes(1);
		expect(doubleTap).not.toHaveBeenCalled();

		tapAt(child, 30, 40, touch);
		expect(tap).toHaveBeenCalledTimes(1);
		vi.advanceTimersByTime(300);
		expect(tap).toHaveBeenCalledTimes(2);
		root.unmount();
	});

	it('long taps after holding still and skips the following tap', () => {
		const tap = vi.fn();
		const longTap = vi.fn();
		const { root, el } = mountGesture({ tap, longTap });

		firePointer(el, 'pointerdown', 30, 40, { pointerType: 'touch' });
		vi.advanceTimersByTime(800);
		expect(longTap).toHaveBeenCalledWith(expect.objectContaining({ x: 20, y: 20, pointerType: 'touch' }));
		firePointer(el, 'pointerup', 30, 40, { pointerType: 'touch' });
		expect(tap).not.toHaveBeenCalled();

		firePointer(el, 'pointerdown', 30, 40);
		firePointer(el, 'pointermove', 60, 40);
		vi.advanceTimersByTime(800);
		firePointer(el, 'pointerup', 60, 40);
		expect(longTap).toHaveBeenCalledTimes(1);
		root.unmount();
	});

	it('moves after the threshold with deltas, offsets, velocity and swipe', () => {
		const options = {
			tap: vi.fn(),
			moveStart: vi.fn(),
			move: vi.fn(),
			moveEnd: vi.fn(),
			swipe: vi.fn()
		};
		const { root, el } = mountGesture(options);

		firePointer(el, 'pointerdown', 10, 20);
		firePointer(el, 'pointermove', 15, 20);
		expect(options.moveStart).not.toHaveBeenCalled();

		vi.advanceTimersByTime(10);
		firePointer(el, 'pointermove', 30, 25);
		expect(options.moveStart).toHaveBeenCalledWith(expect.objectContaining({ axis: 'x', offsetX: 20, offsetY: 5 }));
		expect(options.move).toHaveBeenLastCalledWith(expect.objectContaining({ x: 20, y: 5, deltaX: 20, deltaY: 5, offsetX: 20, offsetY: 5 }));

		vi.advanceTimersByTime(10);
		firePointer(el, 'pointermove', 40, 25);
		expect(options.move).toHaveBeenLastCalledWith(expect.objectContaining({ deltaX: 10, deltaY: 0, offsetX: 30 }));

		firePointer(el, 'pointerup', 40, 25);
		const end = options.moveEnd.mock.calls[0][0];
		expect(end).toEqual(expect.objectContaining({ offsetX: 30, offsetY: 5, canceled: false }));
		expect(end.velocityX).toBeGreaterThan(0.6);
		expect(options.swipe).toHaveBeenCalledWith(expect.objectContaining({ direction: 'right', offsetX: 30 }));
		expect(options.tap).not.toHaveBeenCalled();

		// 停顿后松开：速度为 0，不算 swipe
		firePointer(el, 'pointerdown', 10, 100);
		vi.advanceTimersByTime(10);
		firePointer(el, 'pointermove', 10, 40);
		vi.advanceTimersByTime(200);
		firePointer(el, 'pointerup', 10, 40);
		expect(options.moveStart).toHaveBeenLastCalledWith(expect.objectContaining({ axis: 'y' }));
		expect(options.moveEnd).toHaveBeenLastCalledWith(expect.objectContaining({ velocityX: 0, velocityY: 0 }));
		expect(options.swipe).toHaveBeenCalledTimes(1);
		root.unmount();
	});

	it.each([
		['left', -60, 0],
		['up', 0, -60],
		['down', 0, 60]
	])('swipes %s by the dominant axis', (direction, dx, dy) => {
		const swipe = vi.fn();
		const { root, el } = mountGesture({ swipe, threshold: 4, flickThreshold: 0.1 });

		firePointer(el, 'pointerdown', 100, 100);
		vi.advanceTimersByTime(20);
		firePointer(el, 'pointermove', 100 + dx, 100 + dy);
		firePointer(el, 'pointerup', 100 + dx, 100 + dy);
		expect(swipe).toHaveBeenCalledWith(expect.objectContaining({ direction }));
		root.unmount();
	});

	it('cancels a move on pointercancel and skips taps', () => {
		const options = { tap: vi.fn(), moveEnd: vi.fn(), swipe: vi.fn() };
		const { root, el } = mountGesture(options);

		firePointer(el, 'pointerdown', 10, 20);
		vi.advanceTimersByTime(5);
		firePointer(el, 'pointermove', 80, 20);
		firePointer(el, 'pointercancel', 80, 20);
		expect(options.moveEnd).toHaveBeenCalledWith(expect.objectContaining({ canceled: true }));
		expect(options.swipe).not.toHaveBeenCalled();

		firePointer(el, 'pointerdown', 10, 20);
		firePointer(el, 'pointercancel', 10, 20);
		expect(options.tap).not.toHaveBeenCalled();

		// 没有按下的指针不处理
		firePointer(el, 'pointermove', 10, 20, { pointerId: 9 });
		firePointer(el, 'pointerup', 10, 20, { pointerId: 9 });
		expect(options.tap).not.toHaveBeenCalled();
		root.unmount();
	});

	it('pinches and rotates with two pointers and can pinch again', () => {
		const options = {
			tap: vi.fn(),
			moveEnd: vi.fn(),
			pinchStart: vi.fn(),
			pinch: vi.fn(),
			pinchEnd: vi.fn(),
			rotate: vi.fn()
		};
		const { root, el } = mountGesture(options);
		// 坐标按元素左上角 (10, 20) 换算回页面坐标
		const touch = (type: string, id: number, x: number, y: number) => {
			firePointer(el, type, x + 10, y + 20, { pointerId: id, pointerType: 'touch' });
		};

		touch('pointerdown', 1, 0, 0);
		touch('pointermove', 1, 20, 0);
		touch('pointerdown', 2, 120, 0);
		// 移动中按下第二根手指：结束移动并开始捏合
		expect(options.moveEnd).toHaveBeenCalledWith(expect.objectContaining({ canceled: true }));
		expect(options.pinchStart).toHaveBeenCalledWith(expect.objectContaining({ scale: 1, center: { x: 70, y: 0 } }));

		touch('pointermove', 2, 220, 0);
		expect(options.pinch).toHaveBeenLastCalledWith(expect.objectContaining({ scale: 2, center: { x: 120, y: 0 } }));
		expect(options.rotate).toHaveBeenLastCalledWith(expect.objectContaining({ angle: 0 }));

		touch('pointermove', 2, 20, 200);
		expect(options.rotate).toHaveBeenLastCalledWith(expect.objectContaining({ angle: 90 }));

		// 第三根手指不参与
		touch('pointerdown', 3, 50, 50);
		touch('pointermove', 3, 90, 90);
		expect(options.pinch).toHaveBeenCalledTimes(2);

		touch('pointerup', 2, 20, 200);
		expect(options.pinchEnd).toHaveBeenCalledTimes(1);
		touch('pointermove', 1, 40, 0);
		touch('pointerup', 2, 20, 200);
		expect(options.pinch).toHaveBeenCalledTimes(2);

		touch('pointerdown', 2, 100, 0);
		expect(options.pinchStart).toHaveBeenCalledTimes(2);
		touch('pointerup', 1, 20, 0);
		touch('pointerup', 2, 100, 0);
		expect(options.pinchEnd).toHaveBeenCalledTimes(2);
		expect(options.tap).not.toHaveBeenCalled();

		tapAt(el, 30, 40);
		expect(options.tap).toHaveBeenCalledTimes(1);
		root.unmount();
	});

	it('ignores presses inside the ignore selector', () => {
		const tap = vi.fn();
		const { root, el } = mountGesture({ tap, ignore: '.ignored' });

		tapAt(el.querySelector('button')!, 30, 40);
		expect(tap).not.toHaveBeenCalled();
		tapAt(el, 30, 40);
		expect(tap).toHaveBeenCalledTimes(1);
		root.unmount();
	});

	it('normalizes wheel deltas and binds wheel only when listened', () => {
		const wheel = vi.fn();
		const { root, el, gesture } = mountGesture({ wheel });
		Object.defineProperty(el, 'clientHeight', { configurable: true, value: 200 });

		const pixel = fireWheel(el, { deltaY: 3, deltaX: 1, clientX: 30, clientY: 40 });
		expect(pixel.defaultPrevented).toBe(true);
		expect(wheel).toHaveBeenLastCalledWith(expect.objectContaining({ x: 20, y: 20, deltaX: 1, deltaY: 3 }));
		fireWheel(el, { deltaY: 2, deltaMode: 1 });
		expect(wheel).toHaveBeenLastCalledWith(expect.objectContaining({ deltaY: 32 }));
		fireWheel(el, { deltaY: 1, deltaMode: 2 });
		expect(wheel).toHaveBeenLastCalledWith(expect.objectContaining({ deltaY: 200 }));
		expect(gesture.listeners.onWheel).toBeTypeOf('function');
		root.unmount();

		const passive = mountGesture({ wheel, prevent: false });
		expect(fireWheel(passive.el, { deltaY: 1 }).defaultPrevented).toBe(false);
		passive.root.unmount();

		const none = mountGesture({});
		expect(none.gesture.listeners.onWheel).toBeUndefined();
		none.root.unmount();
	});

	it('cancels pending taps and the current gesture, also on unmount', () => {
		const tap = vi.fn();
		const doubleTap = vi.fn();
		const moveEnd = vi.fn();
		const { root, el, gesture } = mountGesture({ tap, doubleTap, moveEnd });

		tapAt(el, 30, 40, { pointerType: 'touch' });
		gesture.cancel();
		vi.advanceTimersByTime(300);
		expect(tap).not.toHaveBeenCalled();

		firePointer(el, 'pointerdown', 10, 20);
		firePointer(el, 'pointermove', 80, 20);
		gesture.cancel();
		firePointer(el, 'pointerup', 80, 20);
		expect(moveEnd).not.toHaveBeenCalled();

		tapAt(el, 30, 40, { pointerType: 'touch' });
		root.unmount();
		vi.advanceTimersByTime(300);
		expect(tap).not.toHaveBeenCalled();
	});
});
