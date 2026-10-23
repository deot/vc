// @vitest-environment jsdom

import { Gesture, MGesture } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { vi } from 'vitest';

const firePointer = (el: EventTarget, type: string, x: number, y: number, init: PointerEventInit = {}) => {
	el.dispatchEvent(new PointerEvent(type, {
		bubbles: true,
		cancelable: true,
		button: 0,
		pointerId: 1,
		pointerType: 'touch',
		clientX: x,
		clientY: y,
		...init
	}));
};

describe('Gesture', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(0);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('exports the component and renders the tag, classes and slot', () => {
		expect(MGesture).toBe(Gesture);

		const wrapper = mount(() => (
			<Gesture tag="section">
				<span class="content">content</span>
			</Gesture>
		));
		expect(wrapper.element.tagName).toBe('SECTION');
		expect(wrapper.classes()).toEqual(['vc-gesture', 'is-prevent']);
		expect(wrapper.find('.content').text()).toBe('content');

		const free = mount(() => <Gesture prevent={false} />);
		expect(free.classes()).toEqual(['vc-gesture']);
	});

	it('forwards taps, long taps and moves', () => {
		const onTap = vi.fn();
		const onLongTap = vi.fn();
		const onMoveStart = vi.fn();
		const onMove = vi.fn();
		const onMoveEnd = vi.fn();
		const onSwipe = vi.fn();
		const onSwipeRight = vi.fn();
		const wrapper = mount(() => (
			<Gesture
				threshold={4}
				flickThreshold={0.1}
				onTap={onTap}
				onLongTap={onLongTap}
				onMoveStart={onMoveStart}
				onMove={onMove}
				onMoveEnd={onMoveEnd}
				onSwipe={onSwipe}
				onSwipeRight={onSwipeRight}
			/>
		));
		const el = wrapper.element;

		firePointer(el, 'pointerdown', 10, 10);
		firePointer(el, 'pointerup', 10, 10);
		expect(onTap).toHaveBeenCalledWith(expect.objectContaining({ x: 10, y: 10, pointerType: 'touch' }));

		firePointer(el, 'pointerdown', 10, 10);
		vi.advanceTimersByTime(800);
		firePointer(el, 'pointerup', 10, 10);
		expect(onLongTap).toHaveBeenCalledTimes(1);
		expect(onTap).toHaveBeenCalledTimes(1);

		firePointer(el, 'pointerdown', 10, 10);
		vi.advanceTimersByTime(10);
		firePointer(el, 'pointermove', 50, 12);
		firePointer(el, 'pointerup', 50, 12);
		expect(onMoveStart).toHaveBeenCalledWith(expect.objectContaining({ axis: 'x' }));
		expect(onMove).toHaveBeenCalledWith(expect.objectContaining({ deltaX: 40, offsetX: 40 }));
		expect(onMoveEnd).toHaveBeenCalledWith(expect.objectContaining({ offsetX: 40, canceled: false }));
		expect(onSwipe).toHaveBeenCalledWith(expect.objectContaining({ direction: 'right' }));
		expect(onSwipeRight).toHaveBeenCalledTimes(1);
	});

	it('waits for double taps only when listened and ignores selected targets', () => {
		const onTap = vi.fn();
		const onDoubleTap = vi.fn();
		const wrapper = mount(() => (
			<Gesture ignore="button" onTap={onTap} onDoubleTap={onDoubleTap}>
				<button class="skip" />
			</Gesture>
		));
		const el = wrapper.element;

		firePointer(el, 'pointerdown', 10, 10);
		firePointer(el, 'pointerup', 10, 10);
		firePointer(el, 'pointerdown', 12, 10);
		firePointer(el, 'pointerup', 12, 10);
		expect(onDoubleTap).toHaveBeenCalledTimes(1);
		vi.advanceTimersByTime(300);
		expect(onTap).not.toHaveBeenCalled();

		const button = el.querySelector('.skip')!;
		firePointer(button, 'pointerdown', 10, 10);
		firePointer(button, 'pointerup', 10, 10);
		vi.advanceTimersByTime(300);
		expect(onTap).not.toHaveBeenCalled();
	});

	it('forwards pinch, rotate and wheel', () => {
		const onPinchStart = vi.fn();
		const onPinch = vi.fn();
		const onPinchEnd = vi.fn();
		const onRotate = vi.fn();
		const onWheel = vi.fn();
		const wrapper = mount(() => (
			<Gesture
				onPinchStart={onPinchStart}
				onPinch={onPinch}
				onPinchEnd={onPinchEnd}
				onRotate={onRotate}
				onWheel={onWheel}
			/>
		));
		const el = wrapper.element;

		firePointer(el, 'pointerdown', 0, 0, { pointerId: 1 });
		firePointer(el, 'pointerdown', 100, 0, { pointerId: 2 });
		firePointer(el, 'pointermove', 50, 0, { pointerId: 2 });
		firePointer(el, 'pointerup', 50, 0, { pointerId: 2 });
		expect(onPinchStart).toHaveBeenCalledWith(expect.objectContaining({ scale: 1 }));
		expect(onPinch).toHaveBeenCalledWith(expect.objectContaining({ scale: 0.5, center: { x: 25, y: 0 } }));
		expect(onRotate).toHaveBeenCalledWith(expect.objectContaining({ angle: 0 }));
		expect(onPinchEnd).toHaveBeenCalledWith(expect.objectContaining({ scale: 0.5 }));

		const wheel = new WheelEvent('wheel', { deltaY: 4, cancelable: true });
		el.dispatchEvent(wheel);
		expect(onWheel).toHaveBeenCalledWith(expect.objectContaining({ deltaY: 4 }));
		expect(wheel.defaultPrevented).toBe(true);
	});

	it('leaves the wheel alone without a listener and cancels from the instance', () => {
		const onTap = vi.fn();
		const onDoubleTap = vi.fn();
		const wrapper = mount(Gesture, { props: { onTap, onDoubleTap } as any });
		const el = wrapper.element;

		const wheel = new WheelEvent('wheel', { deltaY: 4, cancelable: true });
		el.dispatchEvent(wheel);
		expect(wheel.defaultPrevented).toBe(false);

		firePointer(el, 'pointerdown', 10, 10);
		firePointer(el, 'pointerup', 10, 10);
		(wrapper.vm as any).cancel();
		vi.advanceTimersByTime(300);
		expect(onTap).not.toHaveBeenCalled();
	});
});
