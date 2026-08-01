// @vitest-environment jsdom

import {
	ExternalViewport,
	invalidateViewport,
	registerViewport,
	resolveExternalViewport
} from '../viewport';
import { afterEach, describe, expect, it, vi } from 'vitest';

const verticalKeys = {
	axis: 'y' as const,
	scrollAxis: 'scrollTop' as const,
	clientSize: 'clientHeight' as const,
	scrollSize: 'scrollHeight' as const,
	offsetSize: 'offsetHeight' as const
};

const horizontalKeys = {
	axis: 'x' as const,
	scrollAxis: 'scrollLeft' as const,
	clientSize: 'clientWidth' as const,
	scrollSize: 'scrollWidth' as const,
	offsetSize: 'offsetWidth' as const
};

const restorers: Array<() => void> = [];

const defineValue = (target: object, key: PropertyKey, value: unknown) => {
	const descriptor = Object.getOwnPropertyDescriptor(target, key);
	Object.defineProperty(target, key, {
		configurable: true,
		writable: true,
		value
	});
	restorers.push(() => {
		if (descriptor) {
			Object.defineProperty(target, key, descriptor);
		} else {
			delete (target as any)[key];
		}
	});
};

const mockRect = (
	el: HTMLElement,
	rect: Partial<DOMRect>
) => {
	el.getBoundingClientRect = vi.fn(() => ({
		bottom: 0,
		height: 0,
		left: 0,
		right: 0,
		top: 0,
		width: 0,
		x: 0,
		y: 0,
		toJSON: () => ({}),
		...rect
	}));
};

afterEach(() => {
	for (const restore of restorers.splice(0).reverse()) restore();
	document.body.innerHTML = '';
	vi.restoreAllMocks();
});

describe('ExternalViewport', () => {
	describe('Window target', () => {
		it('reads and writes vertical measurements and element coordinates', () => {
			const scrolling = document.createElement('div');
			defineValue(document, 'scrollingElement', scrolling);
			defineValue(scrolling, 'scrollTop', 125);
			defineValue(scrolling, 'scrollHeight', 2400);
			defineValue(window, 'innerHeight', 600);

			const viewport = new ExternalViewport(window, undefined, verticalKeys);
			const element = document.createElement('div');
			mockRect(element, { top: 75, bottom: 155 });

			expect(viewport.isWindow).toBe(true);
			expect(viewport.mainOffset).toBe(125);
			expect(viewport.clientSize).toBe(600);
			expect(viewport.scrollSize).toBe(2400);
			expect(viewport.getElementStart(element)).toBe(200);
			expect(viewport.getElementEnd(element)).toBe(280);

			viewport.setMainOffset(340);
			expect(scrolling.scrollTop).toBe(340);
		});

		it('supports horizontal fallbacks and native scroll listeners', () => {
			const scrolling = document.createElement('div');
			defineValue(document, 'scrollingElement', scrolling);
			defineValue(scrolling, 'scrollLeft', 0);
			defineValue(scrolling, 'scrollWidth', 3200);
			defineValue(window, 'scrollX', 45);
			defineValue(window, 'innerWidth', 0);
			defineValue(document.documentElement, 'clientWidth', 880);

			const viewport = new ExternalViewport(window, undefined, horizontalKeys);
			const element = document.createElement('div');
			const listener = vi.fn();
			mockRect(element, { left: 30, right: 130 });

			expect(viewport.mainOffset).toBe(45);
			expect(viewport.clientSize).toBe(880);
			expect(viewport.scrollSize).toBe(3200);
			expect(viewport.getElementStart(element)).toBe(75);
			expect(viewport.getElementEnd(element)).toBe(175);

			viewport.on(listener);
			window.dispatchEvent(new Event('scroll'));
			expect(listener).toHaveBeenCalledTimes(1);
			viewport.off(listener);
			window.dispatchEvent(new Event('scroll'));
			expect(listener).toHaveBeenCalledTimes(1);

			viewport.setMainOffset(225);
			expect(scrolling.scrollLeft).toBe(225);
		});
	});

	describe('HTMLElement target', () => {
		it('reads and writes both axes relative to the target content box', () => {
			const target = document.createElement('div');
			const element = document.createElement('div');
			target.appendChild(element);
			defineValue(target, 'scrollTop', 200);
			defineValue(target, 'scrollLeft', 80);
			defineValue(target, 'clientHeight', 400);
			defineValue(target, 'clientWidth', 500);
			defineValue(target, 'scrollHeight', 1800);
			defineValue(target, 'scrollWidth', 2200);
			defineValue(target, 'clientTop', 3);
			defineValue(target, 'clientLeft', 4);
			mockRect(target, { top: 100, left: 50 });
			mockRect(element, {
				top: 150,
				bottom: 210,
				left: 90,
				right: 190
			});

			const vertical = new ExternalViewport(target, undefined, verticalKeys);
			const horizontal = new ExternalViewport(target, undefined, horizontalKeys);

			expect(vertical.isWindow).toBe(false);
			expect(vertical.mainOffset).toBe(200);
			expect(vertical.clientSize).toBe(400);
			expect(vertical.scrollSize).toBe(1800);
			expect(vertical.getElementStart(element)).toBe(247);
			expect(vertical.getElementEnd(element)).toBe(307);
			expect(horizontal.mainOffset).toBe(80);
			expect(horizontal.clientSize).toBe(500);
			expect(horizontal.scrollSize).toBe(2200);
			expect(horizontal.getElementStart(element)).toBe(116);
			expect(horizontal.getElementEnd(element)).toBe(216);

			vertical.setMainOffset(360);
			horizontal.setMainOffset(460);
			expect(target.scrollTop).toBe(360);
			expect(target.scrollLeft).toBe(460);
		});

		it('adds and removes native scroll listeners', () => {
			const target = document.createElement('div');
			const viewport = new ExternalViewport(target, undefined, verticalKeys);
			const listener = vi.fn();

			viewport.on(listener);
			target.dispatchEvent(new Event('scroll'));
			expect(listener).toHaveBeenCalledTimes(1);

			viewport.off(listener);
			target.dispatchEvent(new Event('scroll'));
			expect(listener).toHaveBeenCalledTimes(1);
		});
	});

	it('delegates scrolling and subscriptions to an injected scroller', () => {
		const target = document.createElement('div');
		const scrollTo = vi.fn();
		const on = vi.fn();
		const off = vi.fn();
		const scroller = { wrapper: target, scrollTo, on, off };
		const viewport = new ExternalViewport(target, scroller, horizontalKeys);
		const listener = vi.fn();

		viewport.setMainOffset(95);
		viewport.on(listener);
		viewport.off(listener);

		expect(scrollTo).toHaveBeenCalledOnce();
		expect(scrollTo).toHaveBeenCalledWith({ x: 95 });
		expect(on).toHaveBeenCalledWith(listener);
		expect(off).toHaveBeenCalledWith(listener);
	});
});

describe('resolveExternalViewport', () => {
	it('uses the closest ordinary scrolling ancestor for the requested axis', () => {
		const outer = document.createElement('div');
		const scroller = document.createElement('div');
		const middle = document.createElement('div');
		const root = document.createElement('div');
		outer.style.overflowY = 'auto';
		scroller.style.overflowY = 'scroll';
		scroller.appendChild(middle);
		middle.appendChild(root);
		outer.appendChild(scroller);
		document.body.appendChild(outer);

		const injected = { wrapper: outer, scrollTo: vi.fn() };
		const viewport = resolveExternalViewport(root, injected, verticalKeys);

		expect(viewport.target).toBe(scroller);
		expect(viewport.scroller).toBeUndefined();
	});

	it.each([
		'vc-scroller__wrapper',
		'vc-scroller-wheel'
	])('recognizes a %s ancestor and retains its matching injection', (className) => {
		const wrapper = document.createElement('div');
		const root = document.createElement('div');
		wrapper.className = className;
		wrapper.appendChild(root);
		document.body.appendChild(wrapper);
		const injected = {
			wrapper,
			scrollTo: vi.fn(),
			on: vi.fn(),
			off: vi.fn()
		};

		const viewport = resolveExternalViewport(root, injected, verticalKeys);

		expect(viewport.target).toBe(wrapper);
		expect(viewport.scroller).toBe(injected);
		viewport.setMainOffset(120);
		expect(injected.scrollTo).toHaveBeenCalledWith({ y: 120 });
	});

	it('falls back to Window and does not select the RecycleList root itself', () => {
		const root = document.createElement('div');
		root.className = 'vc-scroller__wrapper';
		root.style.overflowY = 'auto';
		document.body.appendChild(root);

		const viewport = resolveExternalViewport(root, undefined, verticalKeys);

		expect(viewport.target).toBe(window);
		expect(viewport.isWindow).toBe(true);
	});
});

describe('viewport registry', () => {
	it('invalidates registered callbacks and stops after each unregister', () => {
		const target = document.createElement('div');
		target.style.setProperty('overflow-anchor', 'auto', 'important');
		const first = vi.fn();
		const second = vi.fn();
		const unregisterFirst = registerViewport(target, first);
		const unregisterSecond = registerViewport(target, second);
		expect(target.style.getPropertyValue('overflow-anchor')).toBe('none');

		invalidateViewport(target);
		expect(first).toHaveBeenCalledTimes(1);
		expect(second).toHaveBeenCalledTimes(1);

		unregisterFirst();
		expect(target.style.getPropertyValue('overflow-anchor')).toBe('none');
		invalidateViewport(target);
		expect(first).toHaveBeenCalledTimes(1);
		expect(second).toHaveBeenCalledTimes(2);

		unregisterSecond();
		expect(target.style.getPropertyValue('overflow-anchor')).toBe('auto');
		expect(target.style.getPropertyPriority('overflow-anchor')).toBe('important');
		invalidateViewport(target);
		expect(second).toHaveBeenCalledTimes(2);
	});

	it('suppresses Window scroll anchoring and restores an empty inline value', () => {
		const scrolling = document.createElement('div');
		defineValue(document, 'scrollingElement', scrolling);
		const unregister = registerViewport(window, vi.fn());

		expect(scrolling.style.getPropertyValue('overflow-anchor')).toBe('none');
		unregister();
		expect(scrolling.style.getPropertyValue('overflow-anchor')).toBe('');
	});

	it('keeps targets isolated and ignores a missing target', () => {
		const firstTarget = {};
		const secondTarget = {};
		const first = vi.fn();
		const second = vi.fn();
		const unregisterFirst = registerViewport(firstTarget, first);
		const unregisterSecond = registerViewport(secondTarget, second);

		invalidateViewport(firstTarget);
		invalidateViewport(undefined);

		expect(first).toHaveBeenCalledOnce();
		expect(second).not.toHaveBeenCalled();
		unregisterFirst();
		unregisterSecond();
	});
});
