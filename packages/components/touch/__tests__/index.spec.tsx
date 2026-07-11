// @vitest-environment jsdom

import { Touch as TouchComponent } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { vi } from 'vitest';
import { MTouch } from '../index.m';

const makeTouch = (pageX: number, pageY: number) => ({
	pageX,
	pageY,
	clientX: pageX,
	clientY: pageY,
	screenX: pageX,
	screenY: pageY
}) as Touch;

const fireTouch = (
	el: Element,
	type: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel',
	touches: Touch[],
	changedTouches: Touch[] = touches
) => {
	const event = new Event(type, { bubbles: true, cancelable: true }) as TouchEvent;
	Object.defineProperty(event, 'touches', {
		value: touches,
		configurable: true
	});
	Object.defineProperty(event, 'changedTouches', {
		value: changedTouches,
		configurable: true
	});
	const preventDefault = vi.spyOn(event, 'preventDefault');

	el.dispatchEvent(event);

	return {
		event,
		preventDefault
	};
};

const flush = async () => {
	await nextTick();
};

describe('Touch', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(0);
	});

	afterEach(() => {
		document.body.innerHTML = '';
		vi.useRealTimers();
	});

	it('exports components and renders default classes', () => {
		expect(typeof TouchComponent).toBe('object');
		expect(MTouch).toBe(TouchComponent);

		const wrapper = mount(() => (<TouchComponent />));

		expect(wrapper.classes()).toContain('vc-touch');
		expect(wrapper.classes()).toContain('vcm-touch');

		wrapper.unmount();
	});

	it('supports custom root tag and slot content', () => {
		const wrapper = mount(() => (
			<TouchComponent tag="section">
				<span class="content">content</span>
			</TouchComponent>
		));

		expect(wrapper.element.tagName).toBe('SECTION');
		expect(wrapper.find('.content').text()).toBe('content');

		wrapper.unmount();
	});

	it('emits tap on short touch', async () => {
		const onTap = vi.fn();
		const wrapper = mount(() => (<TouchComponent onTap={onTap} />));

		fireTouch(wrapper.element, 'touchstart', [makeTouch(0, 0)]);
		vi.advanceTimersByTime(100);
		fireTouch(wrapper.element, 'touchend', [], [makeTouch(0, 0)]);
		await flush();

		expect(onTap).toHaveBeenCalledTimes(1);

		wrapper.unmount();
	});

	it('emits long-tap after delay and cancels it on move', async () => {
		const onLongTap = vi.fn();
		const wrapper = mount(() => (<TouchComponent onLongTap={onLongTap} />));

		fireTouch(wrapper.element, 'touchstart', [makeTouch(0, 0)]);
		vi.advanceTimersByTime(800);
		await flush();
		expect(onLongTap).toHaveBeenCalledTimes(1);

		fireTouch(wrapper.element, 'touchend', [], [makeTouch(0, 0)]);
		fireTouch(wrapper.element, 'touchstart', [makeTouch(0, 0)]);
		fireTouch(wrapper.element, 'touchmove', [makeTouch(1, 1)]);
		vi.advanceTimersByTime(800);
		await flush();
		expect(onLongTap).toHaveBeenCalledTimes(1);

		wrapper.unmount();
	});

	it('emits double-tap on two close starts within 300ms', async () => {
		const onDoubleTap = vi.fn();
		const wrapper = mount(() => (<TouchComponent onDoubleTap={onDoubleTap} />));

		fireTouch(wrapper.element, 'touchstart', [makeTouch(10, 10)]);
		vi.advanceTimersByTime(50);
		fireTouch(wrapper.element, 'touchend', [], [makeTouch(10, 10)]);
		vi.advanceTimersByTime(100);
		fireTouch(wrapper.element, 'touchstart', [makeTouch(20, 20)]);
		await flush();

		expect(onDoubleTap).toHaveBeenCalledTimes(1);

		wrapper.unmount();
	});

	it('emits move delta and respects prevent prop', async () => {
		const onMove = vi.fn();
		const wrapper = mount(() => (<TouchComponent onMove={onMove} />));

		fireTouch(wrapper.element, 'touchstart', [makeTouch(0, 0)]);
		const first = fireTouch(wrapper.element, 'touchmove', [makeTouch(10, 10)]);
		const second = fireTouch(wrapper.element, 'touchmove', [makeTouch(18, 25)]);
		await flush();

		expect(first.preventDefault).toHaveBeenCalledTimes(1);
		expect(second.preventDefault).toHaveBeenCalledTimes(1);
		expect(onMove).toHaveBeenNthCalledWith(1, { deltaX: 0, deltaY: 0 });
		expect(onMove).toHaveBeenNthCalledWith(2, { deltaX: 8, deltaY: 15 });

		wrapper.unmount();

		const passiveWrapper = mount(() => (<TouchComponent prevent={false} onMove={onMove} />));
		fireTouch(passiveWrapper.element, 'touchstart', [makeTouch(0, 0)]);
		const passiveMove = fireTouch(passiveWrapper.element, 'touchmove', [makeTouch(1, 1)]);

		expect(passiveMove.preventDefault).not.toHaveBeenCalled();

		passiveWrapper.unmount();
	});

	it.each([
		['swipe-left', makeTouch(100, 100), makeTouch(0, 100), { deltaX: -100 }],
		['swipe-right', makeTouch(0, 100), makeTouch(100, 100), { deltaX: 100 }],
		['swipe-up', makeTouch(100, 100), makeTouch(100, 0), { deltaY: -100 }],
		['swipe-down', makeTouch(100, 0), makeTouch(100, 100), { deltaY: 100 }]
	])('emits %s with documented direction semantics', async (eventName, start, end, payload) => {
		const onSwipe = vi.fn();
		const onSwipeLeft = vi.fn();
		const onSwipeRight = vi.fn();
		const onSwipeUp = vi.fn();
		const onSwipeDown = vi.fn();
		const wrapper = mount(() => (
			<TouchComponent
				flickThreshold={0.1}
				onSwipe={onSwipe}
				onSwipeLeft={onSwipeLeft}
				onSwipeRight={onSwipeRight}
				onSwipeUp={onSwipeUp}
				onSwipeDown={onSwipeDown}
			/>
		));

		fireTouch(wrapper.element, 'touchstart', [start]);
		vi.advanceTimersByTime(50);
		fireTouch(wrapper.element, 'touchmove', [end]);
		vi.advanceTimersByTime(50);
		fireTouch(wrapper.element, 'touchend', [], [end]);
		await flush();

		expect(onSwipe).toHaveBeenCalledWith(expect.objectContaining({
			deltaX: end.pageX - start.pageX,
			deltaY: end.pageY - start.pageY,
			isFlick: true
		}));
		const target = {
			'swipe-left': onSwipeLeft,
			'swipe-right': onSwipeRight,
			'swipe-up': onSwipeUp,
			'swipe-down': onSwipeDown
		}[eventName];
		expect(target).toHaveBeenCalledWith(expect.objectContaining(payload));

		wrapper.unmount();
	});

	it('does not emit swipe when velocity is below threshold', async () => {
		const onSwipe = vi.fn();
		const wrapper = mount(() => (<TouchComponent flickThreshold={10} onSwipe={onSwipe} />));

		fireTouch(wrapper.element, 'touchstart', [makeTouch(0, 0)]);
		vi.advanceTimersByTime(100);
		fireTouch(wrapper.element, 'touchmove', [makeTouch(100, 0)]);
		vi.advanceTimersByTime(100);
		fireTouch(wrapper.element, 'touchend', [], [makeTouch(100, 0)]);
		await flush();

		expect(onSwipe).not.toHaveBeenCalled();

		wrapper.unmount();
	});

	it('emits pinch and rotate for multi-touch moves', async () => {
		const onPinch = vi.fn();
		const onRotate = vi.fn();
		const wrapper = mount(() => (
			<TouchComponent
				onPinch={onPinch}
				onRotate={onRotate}
			/>
		));

		fireTouch(wrapper.element, 'touchstart', [makeTouch(0, 0), makeTouch(0, 100)]);
		fireTouch(wrapper.element, 'touchmove', [makeTouch(0, 0), makeTouch(0, 150)]);
		await flush();

		expect(onPinch).toHaveBeenCalledWith({ scale: 0.5 });
		expect(onRotate).toHaveBeenCalledWith({ angle: 0 });

		fireTouch(wrapper.element, 'touchend', [], [makeTouch(0, 0), makeTouch(0, 150)]);
		fireTouch(wrapper.element, 'touchstart', [makeTouch(0, 0), makeTouch(100, 0)]);
		fireTouch(wrapper.element, 'touchmove', [makeTouch(0, 0), makeTouch(0, 100)]);
		await flush();

		expect(onRotate).toHaveBeenLastCalledWith({ angle: 90 });

		wrapper.unmount();
	});

	it('touchcancel clears the gesture state', async () => {
		const onTap = vi.fn();
		const wrapper = mount(() => (<TouchComponent onTap={onTap} />));

		fireTouch(wrapper.element, 'touchstart', [makeTouch(0, 0)]);
		fireTouch(wrapper.element, 'touchcancel', [], [makeTouch(0, 0)]);
		fireTouch(wrapper.element, 'touchend', [], [makeTouch(0, 0)]);
		await flush();

		expect(onTap).not.toHaveBeenCalled();

		wrapper.unmount();
	});
});
