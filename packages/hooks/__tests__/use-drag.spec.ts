import { h, defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { vi } from 'vitest';
import { useDrag } from '@deot/vc-hooks';
import type { DragOptions } from '@deot/vc-hooks';
import { fireMouse, fireTouch, blocked } from './fixtures/drag';

describe('use-drag.ts', () => {
	const mountDrag = (options: DragOptions) => {
		const Wrapper = defineComponent(() => {
			const drag = useDrag(options);
			return () => h('div', drag.listeners);
		});
		const root = mount(Wrapper, { attachTo: document.body });
		return { root, el: root.element };
	};
	const createOptions = () => ({
		start: vi.fn(),
		move: vi.fn(),
		end: vi.fn(),
		cancel: vi.fn()
	});

	it('tracks the mouse on the document after mousedown', () => {
		const options = createOptions();
		const { root, el } = mountDrag(options);

		const down = fireMouse(el, 'mousedown');
		expect(options.start).toHaveBeenCalledWith(down, down);

		// 指针已离开元素：移动与松开都发生在元素外
		const move = fireMouse(document.body, 'mousemove');
		expect(options.move).toHaveBeenCalledWith(move, move);

		const up = fireMouse(document.body, 'mouseup');
		expect(options.end).toHaveBeenCalledWith(up, up);

		// 松开后不再跟踪
		fireMouse(document.body, 'mousemove');
		fireMouse(document.body, 'mouseup');
		expect(options.move).toHaveBeenCalledTimes(1);
		expect(options.end).toHaveBeenCalledTimes(1);
		expect(options.cancel).not.toHaveBeenCalled();
		root.unmount();
	});

	it('only the primary button starts and ends a drag', () => {
		const options = createOptions();
		const { root, el } = mountDrag(options);

		fireMouse(el, 'mousedown', { button: 2, buttons: 2 });
		fireMouse(document.body, 'mousemove', { buttons: 2 });
		expect(options.start).not.toHaveBeenCalled();
		expect(options.move).not.toHaveBeenCalled();

		fireMouse(el, 'mousedown');
		// 拖动中按下又松开了右键：主键仍按着
		fireMouse(document.body, 'mouseup', { button: 2, buttons: 1 });
		expect(options.end).not.toHaveBeenCalled();
		fireMouse(document.body, 'mousemove');
		expect(options.move).toHaveBeenCalledTimes(1);

		fireMouse(document.body, 'mouseup');
		expect(options.end).toHaveBeenCalledTimes(1);
		root.unmount();
	});

	it('does not track when start returns false', () => {
		const options = { ...createOptions(), start: vi.fn(() => false) };
		const { root, el } = mountDrag(options);

		fireMouse(el, 'mousedown');
		fireMouse(document.body, 'mousemove');
		fireMouse(document.body, 'mouseup');
		expect(options.start).toHaveBeenCalledTimes(1);
		expect(options.move).not.toHaveBeenCalled();
		expect(options.end).not.toHaveBeenCalled();
		root.unmount();
	});

	it('cancels once when the primary button is no longer pressed without a mouseup', () => {
		const options = createOptions();
		const { root, el } = mountDrag(options);

		fireMouse(el, 'mousedown');
		// 右键菜单、原生拖拽等吞掉了 mouseup：下一次移动时主键已松开
		const move = fireMouse(document.body, 'mousemove', { buttons: 0 });
		expect(options.cancel).toHaveBeenCalledWith(move, move);
		expect(options.move).not.toHaveBeenCalled();
		expect(options.end).not.toHaveBeenCalled();

		// 已解绑
		fireMouse(document.body, 'mousemove', { buttons: 0 });
		fireMouse(document.body, 'mousemove');
		expect(options.cancel).toHaveBeenCalledTimes(1);
		expect(options.move).not.toHaveBeenCalled();
		root.unmount();
	});

	it('falls back to end when cancel is omitted', () => {
		const options = { start: vi.fn(), move: vi.fn(), end: vi.fn() };
		const { root, el } = mountDrag(options);

		fireMouse(el, 'mousedown');
		fireMouse(document.body, 'mousemove', { buttons: 0 });
		expect(options.end).toHaveBeenCalledTimes(1);

		fireTouch(el, 'touchstart');
		fireTouch(el, 'touchcancel');
		expect(options.end).toHaveBeenCalledTimes(2);
		root.unmount();
	});

	it('stops tracking the document when unmounted while dragging', () => {
		const options = createOptions();
		const { root, el } = mountDrag(options);

		fireMouse(el, 'mousedown');
		root.unmount();

		fireMouse(document.body, 'mousemove');
		fireMouse(document.body, 'mouseup');
		expect(options.move).not.toHaveBeenCalled();
		expect(options.end).not.toHaveBeenCalled();
	});

	describe('touch', () => {
		it('forwards a touch gesture with its touch point', () => {
			const options = createOptions();
			const { root, el } = mountDrag(options);
			const point = expect.objectContaining({ screenX: 10, screenY: 20 });

			const start = fireTouch(el, 'touchstart', { screenX: 10, screenY: 20 });
			expect(options.start).toHaveBeenCalledWith(start, point);

			const move = fireTouch(el, 'touchmove', { screenX: 10, screenY: 20 });
			expect(options.move).toHaveBeenCalledWith(move, point);

			const end = fireTouch(el, 'touchend', { screenX: 10, screenY: 20 });
			expect(options.end).toHaveBeenCalledWith(end, point);

			// 系统手势等打断了触摸
			fireTouch(el, 'touchstart');
			const cancel = fireTouch(el, 'touchcancel', { screenX: 10, screenY: 20 });
			expect(options.cancel).toHaveBeenCalledWith(cancel, point);

			// 手势结束后不再转发
			fireTouch(el, 'touchmove');
			fireTouch(el, 'touchend');
			fireTouch(el, 'touchcancel');
			expect(options.move).toHaveBeenCalledTimes(1);
			expect(options.end).toHaveBeenCalledTimes(1);
			expect(options.cancel).toHaveBeenCalledTimes(1);
			root.unmount();
		});

		it('does not forward anything after start returns false', () => {
			const options = { ...createOptions(), start: vi.fn(() => false) };
			const { root, el } = mountDrag(options);

			fireTouch(el, 'touchstart');
			fireTouch(el, 'touchmove');
			fireTouch(el, 'touchend');
			expect(options.start).toHaveBeenCalledTimes(1);
			expect(options.move).not.toHaveBeenCalled();
			expect(options.end).not.toHaveBeenCalled();
			root.unmount();
		});

		it('follows only the touch that started the gesture', () => {
			const options = createOptions();
			const { root, el } = mountDrag(options);
			const first = { identifier: 0, screenY: 10 };
			const second = { identifier: 1, screenY: 200 };

			fireTouch(el, 'touchstart', first);
			// 第二根手指按下、移动、抬起都不参与
			fireTouch(el, 'touchstart', second, [first]);
			fireTouch(el, 'touchmove', second, [first]);
			expect(options.start).toHaveBeenCalledTimes(1);
			expect(options.move).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining(first));

			fireTouch(el, 'touchend', second, [first]);
			expect(options.end).not.toHaveBeenCalled();

			// 发起手势的触点抬起才结束，即使另一根手指还按着
			fireTouch(el, 'touchstart', second, [first]);
			const end = fireTouch(el, 'touchend', first, [second]);
			expect(options.end).toHaveBeenCalledWith(end, expect.objectContaining(first));
			root.unmount();
		});

		it('starts over when the previous touch never ended', () => {
			const options = createOptions();
			const { root, el } = mountDrag(options);

			fireTouch(el, 'touchstart', { identifier: 0, screenY: 10 });
			// 没收到上一个触点的结束（如元素被重建），同一个 identifier 再次按下
			fireTouch(el, 'touchstart', { identifier: 0, screenY: 50 });
			expect(options.start).toHaveBeenCalledTimes(2);

			fireTouch(el, 'touchend', { identifier: 0, screenY: 50 });
			expect(options.end).toHaveBeenCalledTimes(1);
			root.unmount();
		});

		it('ignores touch events without any touch point', () => {
			const options = createOptions();
			const { root, el } = mountDrag(options);

			expect(() => {
				el.dispatchEvent(new Event('touchstart'));
				el.dispatchEvent(new Event('touchmove'));
				el.dispatchEvent(new Event('touchend'));
			}).not.toThrow();
			expect(options.start).not.toHaveBeenCalled();
			root.unmount();
		});
	});

	describe('selectable', () => {
		it('keeps text selection and native drag by default', () => {
			const { root, el } = mountDrag(createOptions());

			fireMouse(el, 'mousedown');
			expect(blocked('selectstart')).toBe(false);
			expect(blocked('dragstart')).toBe(false);
			root.unmount();
		});

		it('blocks them only while dragging with the mouse when selectable is false', () => {
			const { root, el } = mountDrag({ ...createOptions(), selectable: false });
			const own = () => {};
			document.onselectstart = own;

			expect(blocked('selectstart')).toBe(false);

			fireMouse(el, 'mousedown');
			expect(blocked('selectstart')).toBe(true);
			expect(blocked('dragstart')).toBe(true);

			fireMouse(document.body, 'mouseup');
			expect(blocked('selectstart')).toBe(false);
			expect(blocked('dragstart')).toBe(false);

			// 触摸不涉及选区
			fireTouch(el, 'touchstart');
			expect(blocked('selectstart')).toBe(false);
			fireTouch(el, 'touchend');

			// 用监听实现，不占用 document.onselectstart
			expect(document.onselectstart).toBe(own);
			document.onselectstart = null;
			root.unmount();
		});

		it('restores them when the drag is cancelled or the component unmounts', () => {
			const { root, el } = mountDrag({ ...createOptions(), selectable: false });

			fireMouse(el, 'mousedown');
			fireMouse(document.body, 'mousemove', { buttons: 0 });
			expect(blocked('selectstart')).toBe(false);

			fireMouse(el, 'mousedown');
			expect(blocked('selectstart')).toBe(true);
			root.unmount();
			expect(blocked('selectstart')).toBe(false);
			expect(blocked('dragstart')).toBe(false);
		});

		it('does not block them when start returns false', () => {
			const { root, el } = mountDrag({ start: () => false, selectable: false });

			fireMouse(el, 'mousedown');
			expect(blocked('selectstart')).toBe(false);
			root.unmount();
		});
	});

	it('works without any callback', () => {
		const { root, el } = mountDrag({});

		expect(() => {
			fireMouse(el, 'mousedown');
			fireMouse(document.body, 'mousemove');
			fireMouse(document.body, 'mousemove', { buttons: 0 });
			fireMouse(el, 'mousedown');
			fireMouse(document.body, 'mouseup');
			fireTouch(el, 'touchstart');
			fireTouch(el, 'touchmove');
			fireTouch(el, 'touchend');
			fireTouch(el, 'touchcancel');
		}).not.toThrow();
		root.unmount();
	});
});
