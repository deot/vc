// @vitest-environment jsdom

import { vi } from 'vitest';

// 在模块导入前把 `ontouchend` 从 Document 原型上移除，
// 让 `artboard.tsx` 顶层的 `isTouch` 判定为 false，覆盖鼠标事件路径。
vi.hoisted(() => {
	const desc = Object.getOwnPropertyDescriptor(Document.prototype, 'ontouchend');
	if (desc) {
		delete (Document.prototype as any).ontouchend;
	}
});

import { Artboard } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { Utils } from '@deot/dev-test';

const getExposed = (wrapper: any, key: string) => {
	const exposed = wrapper.vm?.[key] ?? wrapper.vm?.$?.exposed?.[key];
	if (exposed?.__v_isRef) return exposed.value;
	return exposed;
};

const getContext = (wrapper: any) => getExposed(wrapper, 'context') as CanvasRenderingContext2D;

const fireMouse = (type: string, target: Element, x = 10, y = 10) => {
	const event = new MouseEvent(type, {
		bubbles: true,
		cancelable: true,
		clientX: x,
		clientY: y
	});
	target.dispatchEvent(event);
	return event;
};

afterEach(() => {
	vi.restoreAllMocks();
});

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Artboard).toBe('object');
	});

	it('create', async () => {
		const wrapper = mount(() => (<Artboard />));

		expect(wrapper.classes()).toContain('vc-artboard');
		expect(wrapper.find('canvas').exists()).toBe(true);
	});

	it('applies width/height props to canvas style', async () => {
		const wrapper = mount(() => (<Artboard width={300} height={200} />), { attachTo: document.body });
		await nextTick();

		const canvasEl = wrapper.find('canvas').element as HTMLCanvasElement;
		expect(canvasEl.style.width).toBe('300px');
		expect(canvasEl.style.height).toBe('200px');

		wrapper.unmount();
	});

	it('falls back to getBoundingClientRect when width/height not provided', async () => {
		const rectSpy = vi
			.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect')
			.mockReturnValue({
				top: 0,
				left: 0,
				bottom: 80,
				right: 150,
				width: 150,
				height: 80,
				x: 0,
				y: 0,
				toJSON: () => ({})
			} as DOMRect);

		const wrapper = mount(() => (<Artboard />), { attachTo: document.body });
		await nextTick();

		const canvasEl = wrapper.find('canvas').element as HTMLCanvasElement;
		expect(canvasEl.style.width).toBe('150px');
		expect(canvasEl.style.height).toBe('80px');

		rectSpy.mockRestore();
		wrapper.unmount();
	});

	it('falls back to direct width/height when devicePixelRatio is falsy', async () => {
		const descriptor = Object.getOwnPropertyDescriptor(window, 'devicePixelRatio');
		Object.defineProperty(window, 'devicePixelRatio', {
			configurable: true,
			value: 0
		});

		const wrapper = mount(() => (<Artboard width={300} height={200} />), { attachTo: document.body });
		await nextTick();

		const canvasEl = wrapper.find('canvas').element as HTMLCanvasElement;
		expect(canvasEl.width).toBe(300);
		expect(canvasEl.height).toBe(200);
		// style 未被设置（走的是 else 分支）
		expect(canvasEl.style.width).toBe('');
		expect(canvasEl.style.height).toBe('');

		wrapper.unmount();
		if (descriptor) {
			Object.defineProperty(window, 'devicePixelRatio', descriptor);
		}
	});

	it('passes options to canvas context', async () => {
		const options = { strokeStyle: 'red', shadowColor: 'red', lineWidth: 5 };
		const wrapper = mount(() => (<Artboard options={options} />), { attachTo: document.body });

		await nextTick();

		const context = getContext(wrapper.findComponent(Artboard));
		expect(context.strokeStyle).toBe('#ff0000');
		expect(context.shadowColor).toBe('#ff0000');
		expect(context.lineWidth).toBe(5);
		expect(context.lineCap).toBe('round');
		expect(context.lineJoin).toBe('round');

		wrapper.unmount();
	});

	it('exposes canvas / context / reset / undo / redo / redraw / draw', async () => {
		const wrapper = mount(Artboard, { attachTo: document.body });
		await nextTick();

		const vm = wrapper.vm as any;
		expect(getExposed(wrapper, 'canvas')).toBeInstanceOf(HTMLCanvasElement);
		expect(getContext(wrapper).canvas).toBe(getExposed(wrapper, 'canvas'));
		expect(typeof vm.reset).toBe('function');
		expect(typeof vm.undo).toBe('function');
		expect(typeof vm.redo).toBe('function');
		expect(typeof vm.redraw).toBe('function');
		expect(typeof vm.draw).toBe('function');

		wrapper.unmount();
	});

	it('redraw clears canvas', async () => {
		const wrapper = mount(Artboard, {
			props: { width: 300, height: 200 },
			attachTo: document.body
		});
		await nextTick();

		const clearRect = vi.spyOn(getContext(wrapper), 'clearRect');
		(wrapper.vm as any).redraw();
		expect(clearRect).toHaveBeenCalledWith(0, 0, 300, 200);

		wrapper.unmount();
	});

	it('draw iterates points and calls context methods', async () => {
		const wrapper = mount(Artboard, {
			props: { width: 300, height: 200 },
			attachTo: document.body
		});
		await nextTick();

		const context = getContext(wrapper);
		const beginPath = vi.spyOn(context, 'beginPath');
		const moveTo = vi.spyOn(context, 'moveTo');
		const lineTo = vi.spyOn(context, 'lineTo');
		const stroke = vi.spyOn(context, 'stroke');
		const points = [
			{ x: 1, y: 2 },
			{ x: 3, y: 4 },
			{ x: 5, y: 6 }
		];
		(wrapper.vm as any).draw(points);

		expect(beginPath).toHaveBeenCalledTimes(1);
		expect(moveTo).toHaveBeenCalledWith(1, 2);
		expect(lineTo).toHaveBeenNthCalledWith(1, 3, 4);
		expect(lineTo).toHaveBeenNthCalledWith(2, 5, 6);
		expect(stroke).toHaveBeenCalledTimes(2);

		wrapper.unmount();
	});

	it('undo / redo are no-op when no snapshots', async () => {
		const onChange = vi.fn();
		const wrapper = mount(Artboard, {
			props: { onChange },
			attachTo: document.body
		});
		await nextTick();

		const vm = wrapper.vm as any;
		onChange.mockClear();

		vm.undo();
		vm.redo();
		expect(onChange).not.toHaveBeenCalled();

		wrapper.unmount();
	});

	it('reset clears canvas and emits change with initial payload', async () => {
		const onChange = vi.fn();
		const wrapper = mount(Artboard, {
			props: { width: 300, height: 200, onChange },
			attachTo: document.body
		});
		await nextTick();

		const clearRect = vi.spyOn(getContext(wrapper), 'clearRect');
		(wrapper.vm as any).reset();

		expect(clearRect).toHaveBeenCalledWith(0, 0, 300, 200);
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange).toHaveBeenCalledWith({
			snapshots: [],
			current: 0,
			allowRedo: false,
			allowUndo: false
		});

		wrapper.unmount();
	});

	it('mousedown + mousemove + mouseup pushes snapshot and emits change', async () => {
		const onChange = vi.fn();
		const wrapper = mount(Artboard, {
			props: { width: 300, height: 200, onChange },
			attachTo: document.body
		});
		await nextTick();

		const canvasEl = wrapper.find('canvas').element;

		fireMouse('mousedown', canvasEl, 10, 20);
		// 等待 raf 回调执行（fallback 为 setTimeout 16ms）
		await Utils.sleep(32);
		fireMouse('mousemove', canvasEl, 15, 25);
		await Utils.sleep(32);
		fireMouse('mouseup', canvasEl);

		expect(onChange).toHaveBeenCalledTimes(1);
		const payload = onChange.mock.calls[0][0];
		expect(payload.current).toBe(1);
		expect(payload.allowUndo).toBe(true);
		expect(payload.allowRedo).toBe(false);
		expect(payload.snapshots).toHaveLength(1);
		// 至少包含 mousedown 坐标
		expect(payload.snapshots[0][0]).toEqual({ x: 10, y: 20 });
	});

	it('mouseleave also finishes the current stroke', async () => {
		const onChange = vi.fn();
		const wrapper = mount(Artboard, {
			props: { width: 300, height: 200, onChange },
			attachTo: document.body
		});
		await nextTick();

		const canvasEl = wrapper.find('canvas').element;

		fireMouse('mousedown', canvasEl, 5, 5);
		await Utils.sleep(32);
		fireMouse('mouseleave', canvasEl);

		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange.mock.calls[0][0].current).toBe(1);

		// 再次 mouseleave 时 isPressed 已为 false，不应再触发
		onChange.mockClear();
		fireMouse('mouseleave', canvasEl);
		expect(onChange).not.toHaveBeenCalled();

		wrapper.unmount();
	});

	it('undo after stroke emits updated change and redraws existing strokes', async () => {
		const onChange = vi.fn();
		const wrapper = mount(Artboard, {
			props: { width: 300, height: 200, onChange },
			attachTo: document.body
		});
		await nextTick();

		const canvasEl = wrapper.find('canvas').element;

		fireMouse('mousedown', canvasEl, 10, 20);
		await Utils.sleep(32);
		fireMouse('mouseup', canvasEl);

		fireMouse('mousedown', canvasEl, 30, 40);
		await Utils.sleep(32);
		fireMouse('mouseup', canvasEl);

		onChange.mockClear();
		const context = getContext(wrapper);
		const clearRect = vi.spyOn(context, 'clearRect');
		const beginPath = vi.spyOn(context, 'beginPath');
		const moveTo = vi.spyOn(context, 'moveTo');

		(wrapper.vm as any).undo();

		expect(clearRect).toHaveBeenCalledTimes(1);
		// 仍有一个快照，需要重绘
		expect(beginPath).toHaveBeenCalledTimes(1);
		expect(moveTo).toHaveBeenCalledWith(10, 20);

		expect(onChange).toHaveBeenCalledTimes(1);
		const payload = onChange.mock.calls[0][0];
		expect(payload.current).toBe(1);
		expect(payload.allowUndo).toBe(true);
		expect(payload.allowRedo).toBe(true);
		expect(payload.snapshots).toHaveLength(2);

		wrapper.unmount();
	});

	it('redo after undo restores snapshot', async () => {
		const onChange = vi.fn();
		const wrapper = mount(Artboard, {
			props: { width: 300, height: 200, onChange },
			attachTo: document.body
		});
		await nextTick();

		const canvasEl = wrapper.find('canvas').element;

		fireMouse('mousedown', canvasEl, 10, 20);
		await Utils.sleep(32);
		fireMouse('mouseup', canvasEl);

		const vm = wrapper.vm as any;
		vm.undo();
		onChange.mockClear();
		const context = getContext(wrapper);
		const beginPath = vi.spyOn(context, 'beginPath');
		const moveTo = vi.spyOn(context, 'moveTo');

		vm.redo();

		expect(beginPath).toHaveBeenCalledTimes(1);
		expect(moveTo).toHaveBeenCalledWith(10, 20);

		expect(onChange).toHaveBeenCalledTimes(1);
		const payload = onChange.mock.calls[0][0];
		expect(payload.current).toBe(1);
		expect(payload.allowUndo).toBe(true);
		expect(payload.allowRedo).toBe(false);

		wrapper.unmount();
	});

	it('reset after drawing clears snapshots', async () => {
		const onChange = vi.fn();
		const wrapper = mount(Artboard, {
			props: { width: 300, height: 200, onChange },
			attachTo: document.body
		});
		await nextTick();

		const canvasEl = wrapper.find('canvas').element;

		fireMouse('mousedown', canvasEl, 10, 20);
		await Utils.sleep(32);
		fireMouse('mouseup', canvasEl);

		onChange.mockClear();

		(wrapper.vm as any).reset();

		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange).toHaveBeenCalledWith({
			snapshots: [],
			current: 0,
			allowRedo: false,
			allowUndo: false
		});

		wrapper.unmount();
	});

	it('removes document listeners on unmount', async () => {
		const removeSpy = vi.spyOn(document, 'removeEventListener');
		const wrapper = mount(() => (<Artboard />), { attachTo: document.body });
		await nextTick();

		wrapper.unmount();

		const calls = removeSpy.mock.calls.map(c => c[0]);
		expect(calls).toContain('mousedown');
		expect(calls).toContain('mousemove');
		expect(calls).toContain('mouseup');
		expect(calls).toContain('mouseleave');

		removeSpy.mockRestore();
	});
});
