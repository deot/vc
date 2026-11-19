// @vitest-environment jsdom

import { Resize } from '@deot/helper-resize';
import { ImageCrop, MImageCrop } from '@deot/vc-components';
import { config, mount } from '@vue/test-utils';
import { Utils } from '@deot/dev-test';
import { nextTick } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 走真实 Transition 生命周期：open() 关闭后的 after-leave 才会触发
config.global.stubs.transition = false;

// 舞台 400 × 360，内边距 24：裁剪框活动区域 352 × 312
const AREA = { offsetLeft: 24, offsetTop: 24, offsetWidth: 352, offsetHeight: 312 };

class MockImage {
	static instances: MockImage[] = [];

	crossOrigin: string | null = null;
	onload: (() => void) | null = null;
	onerror: (() => void) | null = null;
	src = '';
	naturalWidth = 0;
	naturalHeight = 0;

	constructor() {
		MockImage.instances.push(this);
	}

	load(width = 800, height = 400) {
		this.naturalWidth = width;
		this.naturalHeight = height;
		this.onload?.();
	}

	fail() {
		this.onerror?.();
	}
}

const originalImage = window.Image;
const descriptors: Record<string, PropertyDescriptor | undefined> = {};

const flush = async () => {
	for (let i = 0; i < 3; i++) {
		await nextTick();
		await Promise.resolve();
	}
};

// jsdom 未暴露 CanvasRenderingContext2D：从实例取原型
const contextProto = () => Object.getPrototypeOf(document.createElement('canvas').getContext('2d')!);

const lastImage = () => MockImage.instances[MockImage.instances.length - 1];

const firePointer = (el: EventTarget, type: string, x: number, y: number, init: PointerEventInit = {}) => {
	el.dispatchEvent(new PointerEvent(type, {
		bubbles: true,
		cancelable: true,
		button: 0,
		pointerId: 1,
		pointerType: 'mouse',
		clientX: x,
		clientY: y,
		...init
	}));
};

const drag = (el: Element, from: [number, number], to: [number, number], target: Element = el) => {
	firePointer(target, 'pointerdown', from[0], from[1]);
	firePointer(el, 'pointermove', (from[0] + to[0]) / 2, (from[1] + to[1]) / 2);
	firePointer(el, 'pointermove', to[0], to[1]);
	firePointer(el, 'pointerup', to[0], to[1]);
};

// 读内联样式中的数字：图片 [宽, 高, x, y, 角度]，裁剪框 [宽, 高, x, y]
const numbers = (el: Element) => (el.getAttribute('style') || '').match(/-?[\d.]+(e-?\d+)?/g)!.map(Number);

const isCovered = (root: Element) => {
	const [iw, ih, tx, ty, rotate] = numbers(root.querySelector('.vc-image-crop__image')!);
	const [fw, fh, fx, fy] = numbers(root.querySelector('.vc-image-crop__frame')!);
	const cx = tx + iw / 2;
	const cy = ty + ih / 2;
	const r = (rotate * Math.PI) / 180;
	return [[fx, fy], [fx + fw, fy], [fx, fy + fh], [fx + fw, fy + fh]].every(([x, y]) => {
		const lx = (x - cx) * Math.cos(r) + (y - cy) * Math.sin(r);
		const ly = -(x - cx) * Math.sin(r) + (y - cy) * Math.cos(r);
		return Math.abs(lx) <= iw / 2 + 0.05 && Math.abs(ly) <= ih / 2 + 0.05;
	});
};

const mountCrop = async (props: Record<string, any> = {}, component: any = ImageCrop) => {
	const wrapper = mount(component, {
		props: { src: 'https://example.com/a.png', ...props },
		attachTo: document.body
	});
	const image = lastImage();
	image?.load(props.imageWidth, props.imageHeight);
	await flush();
	return { wrapper, root: wrapper.element as HTMLElement, vm: wrapper.vm as any };
};

beforeEach(() => {
	MockImage.instances = [];
	(window as any).Image = MockImage;
	(globalThis as any).Image = MockImage;
	Object.entries(AREA).forEach(([key, value]) => {
		descriptors[key] = Object.getOwnPropertyDescriptor(HTMLElement.prototype, key);
		Object.defineProperty(HTMLElement.prototype, key, {
			configurable: true,
			get() {
				return this.classList?.contains('vc-image-crop__area') ? value : 0;
			}
		});
	});
	HTMLElement.prototype.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 360 }) as DOMRect;
	HTMLElement.prototype.setPointerCapture = () => {};
	vi.spyOn(contextProto(), 'drawImage').mockImplementation(() => {});
});

afterEach(() => {
	(window as any).Image = originalImage;
	(globalThis as any).Image = originalImage;
	Object.entries(descriptors).forEach(([key, descriptor]) => {
		descriptor && Object.defineProperty(HTMLElement.prototype, key, descriptor);
	});
	vi.restoreAllMocks();
	vi.useRealTimers();
	document.body.innerHTML = '';
});

describe('image-crop', () => {
	it('exports both ends with open', () => {
		expect(typeof ImageCrop.open).toBe('function');
		expect(typeof MImageCrop.open).toBe('function');
	});

	it('loads a remote image with a timestamp, fits the frame, and covers it', async () => {
		const { wrapper, root } = await mountCrop();
		const image = MockImage.instances[0];
		expect(image.src).toMatch(/^https:\/\/example\.com\/a\.png\?_=\d+$/);
		expect(image.crossOrigin).toBe('anonymous');
		expect(root.className).toBe('vc-image-crop');
		expect(root.getAttribute('tabindex')).toBe('0');
		// 1:1 适配 352 × 312 的活动区域
		expect(numbers(root.querySelector('.vc-image-crop__frame')!)).toEqual([312, 312, 44, 24]);
		// 800 × 400 铺满 312：缩放 0.78
		expect(numbers(root.querySelector('.vc-image-crop__image')!).slice(0, 2)).toEqual([624, 312]);
		expect(root.querySelector('img')!.getAttribute('crossorigin')).toBe('anonymous');
		expect(wrapper.emitted('load')![0][0]).toBe(image);
		expect(wrapper.emitted('change')!.at(-1)![0]).toEqual({ x: 200, y: 0, width: 400, height: 400, rotate: 0 });
		expect(isCovered(root)).toBe(true);
		wrapper.unmount();
	});

	it('keeps data URLs and blobs untouched, revokes object URLs, clears on empty src, and ignores stale loads', async () => {
		const createObjectURL = vi.fn(() => 'blob:crop');
		const revokeObjectURL = vi.fn();
		Object.assign(URL, { createObjectURL, revokeObjectURL });
		const { wrapper, root } = await mountCrop({ src: 'data:image/png;base64,a' });
		expect(MockImage.instances[0].src).toBe('data:image/png;base64,a');
		expect(MockImage.instances[0].crossOrigin).toBe(null);

		await wrapper.setProps({ src: new Blob(['a'], { type: 'image/png' }) });
		expect(lastImage().src).toBe('blob:crop');
		// 加载完成前又换了图：旧图的回调不生效
		const stale = lastImage();
		await wrapper.setProps({ src: 'data:image/png;base64,b' });
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:crop');
		stale.load(10, 10);
		lastImage().load(600, 600);
		await flush();
		expect(wrapper.emitted('load')!.at(-1)![0]).toBe(lastImage());
		expect(numbers(root.querySelector('.vc-image-crop__image')!).slice(0, 2)).toEqual([312, 312]);

		await wrapper.setProps({ src: '' });
		await flush();
		expect(root.querySelector('img')).toBe(null);
		wrapper.unmount();
	});

	it('emits error when loading fails', async () => {
		const wrapper = mount(ImageCrop, { props: { src: 'https://example.com/x.png' } });
		lastImage().fail();
		await flush();
		expect(wrapper.emitted('error')![0][0]).toBeInstanceOf(Error);
		expect(wrapper.emitted('load')).toBeUndefined();
		wrapper.unmount();
	});

	it('pans by dragging and clamps the image to keep the frame covered', async () => {
		const { wrapper, root } = await mountCrop();
		firePointer(root, 'pointerdown', 200, 180);
		firePointer(root, 'pointermove', 260, 180);
		await nextTick();
		expect(root.classList.contains('is-active')).toBe(true);
		firePointer(root, 'pointermove', 900, 900);
		firePointer(root, 'pointerup', 900, 900);
		await flush();
		expect(root.classList.contains('is-active')).toBe(false);
		expect(isCovered(root)).toBe(true);
		// 拖到最右：裁剪框贴着图片左边缘
		expect(wrapper.emitted('change')!.at(-1)![0]).toMatchObject({ x: 0, y: 0 });
		wrapper.unmount();
	});

	it('zooms with the wheel around the pointer within maxZoom, and emits change once it settles', async () => {
		vi.useFakeTimers();
		const { wrapper, root, vm } = await mountCrop({ maxZoom: 2 });
		const changes = wrapper.emitted('change')!.length;
		root.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -100, clientX: 200, clientY: 180 }));
		await nextTick();
		const zoom = wrapper.emitted('update:zoom')!.at(-1)![0] as number;
		expect(zoom).toBeGreaterThan(1);
		for (let i = 0; i < 20; i++) {
			root.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -200, clientX: 200, clientY: 180 }));
		}
		await nextTick();
		expect(wrapper.emitted('update:zoom')!.at(-1)![0]).toBe(2);
		expect(wrapper.emitted('change')!.length).toBe(changes);
		vi.advanceTimersByTime(250);
		expect(wrapper.emitted('change')!.length).toBe(changes + 1);
		expect(vm.getData().width).toBe(200);
		wrapper.unmount();
	});

	it('zooms with two fingers and ignores the wheel on mobile', async () => {
		const { wrapper, root } = await mountCrop({}, MImageCrop);
		expect(root.className).toBe('vc-image-crop vcm-image-crop');
		root.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -100 }));
		expect(wrapper.emitted('update:zoom')).toBeUndefined();

		const touch = { pointerType: 'touch' };
		firePointer(root, 'pointerdown', 180, 180, { ...touch, pointerId: 1 });
		firePointer(root, 'pointerdown', 220, 180, { ...touch, pointerId: 2 });
		firePointer(root, 'pointermove', 140, 180, { ...touch, pointerId: 1 });
		firePointer(root, 'pointermove', 260, 180, { ...touch, pointerId: 2 });
		await nextTick();
		expect(root.classList.contains('is-active')).toBe(true);
		firePointer(root, 'pointerup', 140, 180, { ...touch, pointerId: 1 });
		firePointer(root, 'pointerup', 260, 180, { ...touch, pointerId: 2 });
		await flush();
		expect(wrapper.emitted('update:zoom')!.at(-1)![0]).toBeCloseTo(3);
		expect(root.classList.contains('is-active')).toBe(false);
		expect(isCovered(root)).toBe(true);
		wrapper.unmount();
	});

	it('follows zoom and rotate props, keeping the zoom while rotating', async () => {
		vi.useFakeTimers();
		const { wrapper, root } = await mountCrop({ zoom: 1.5, rotate: 0 });
		expect(numbers(root.querySelector('.vc-image-crop__image')!).slice(0, 2)).toEqual([936, 468]);
		await wrapper.setProps({ zoom: 2 });
		expect(numbers(root.querySelector('.vc-image-crop__image')!).slice(0, 2)).toEqual([1248, 624]);
		// 转 90°：有动画
		await wrapper.setProps({ rotate: 90 });
		expect(root.classList.contains('is-animating')).toBe(true);
		expect(root.querySelector('img')!.getAttribute('style')).toContain('rotate(90deg)');
		expect(isCovered(root)).toBe(true);
		// 任意角度（如滑块连续拖动）：没有动画；铺满所需的缩放变大，zoom 不变
		await wrapper.setProps({ rotate: 80 });
		expect(root.classList.contains('is-animating')).toBe(false);
		expect(isCovered(root)).toBe(true);
		expect(wrapper.emitted('update:zoom')).toBeUndefined();
		await wrapper.setProps({ maxZoom: 1 });
		expect(wrapper.emitted('update:zoom')!.at(-1)![0]).toBe(1);
		wrapper.unmount();
	});

	it('moves with arrow keys and zooms with + / -', async () => {
		const { wrapper, root, vm } = await mountCrop();
		const press = (key: string, init: KeyboardEventInit = {}) => {
			root.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }));
		};
		press('ArrowLeft');
		expect(vm.getData().x).toBeCloseTo(200 + 10 / 0.78);
		press('ArrowUp', { shiftKey: true });
		press('ArrowDown');
		press('ArrowRight');
		press('+');
		expect(wrapper.emitted('update:zoom')!.at(-1)![0]).toBe(1.1);
		press('-');
		// 未绑定 v-model（zoom 仍为 1）时，回到 1 也要发出
		expect(wrapper.emitted('update:zoom')!.at(-1)![0]).toBe(1);
		press('a');
		press('ArrowLeft', { isComposing: true });
		expect(isCovered(root)).toBe(true);
		wrapper.unmount();
	});

	it('resizes the frame by its handles and refits it after release', async () => {
		vi.useFakeTimers();
		const { wrapper, root, vm } = await mountCrop({ resizable: true });
		const handles = root.querySelectorAll('.vc-image-crop__handle');
		expect(handles).toHaveLength(8);
		const se = root.querySelector('.vc-image-crop__handle.is-se')!;
		firePointer(se, 'pointerdown', 356, 336);
		firePointer(root, 'pointermove', 256, 286);
		await nextTick();
		// 比例 1：取变化更大的一边
		expect(numbers(root.querySelector('.vc-image-crop__frame')!)).toEqual([212, 212, 44, 24]);
		firePointer(root, 'pointerup', 256, 286);
		await nextTick();
		// 回中放大，内容不变
		expect(numbers(root.querySelector('.vc-image-crop__frame')!)).toEqual([312, 312, 44, 24]);
		expect(root.classList.contains('is-animating')).toBe(true);
		expect(vm.getData().x).toBeCloseTo(200);
		expect(vm.getData().y).toBeCloseTo(0);
		expect(vm.getData().width).toBeCloseTo(400 * 212 / 312);
		expect(wrapper.emitted('update:zoom')!.at(-1)![0]).toBeCloseTo(312 / 212, 3);

		// 不能拖出图片：向左上拉 nw，被图片上边缘挡住
		const nw = root.querySelector('.vc-image-crop__handle.is-nw')!;
		drag(root, [44, 24], [-200, -200], nw);
		await nextTick();
		expect(isCovered(root)).toBe(true);
		wrapper.unmount();
	});

	it('resizes freely when aspectRatio is null', async () => {
		const { wrapper, root } = await mountCrop({ resizable: true, aspectRatio: null });
		// 不限比例：初始取图片比例 2:1
		expect(numbers(root.querySelector('.vc-image-crop__frame')!)).toEqual([352, 176, 24, 92]);
		const e = root.querySelector('.vc-image-crop__handle.is-e')!;
		drag(root, [376, 180], [276, 180], e);
		await flush();
		// 宽度变为 252，松开后按 252:176 的比例适配
		const [w, h] = numbers(root.querySelector('.vc-image-crop__frame')!);
		expect(w / h).toBeCloseTo(252 / 176);
		// 比例切到 16:9 再切回不限：取图片比例
		await wrapper.setProps({ aspectRatio: 16 / 9 });
		expect(numbers(root.querySelector('.vc-image-crop__frame')!).slice(0, 2)).toEqual([352, 198]);
		await wrapper.setProps({ aspectRatio: null });
		expect(numbers(root.querySelector('.vc-image-crop__frame')!).slice(0, 2)).toEqual([352, 176]);
		wrapper.unmount();
	});

	it('ignores interaction when disabled and renders circle masks', async () => {
		const { wrapper, root, vm } = await mountCrop({ disabled: true, resizable: true, shape: 'circle' });
		expect(root.getAttribute('tabindex')).toBe(null);
		expect(root.classList.contains('is-disabled')).toBe(true);
		expect(root.querySelector('.vc-image-crop__handle')).toBe(null);
		expect(root.querySelector('.vc-image-crop__frame')!.classList.contains('is-circle')).toBe(true);
		const before = vm.getData();
		drag(root, [200, 180], [300, 180]);
		await flush();
		expect(vm.getData()).toEqual(before);
		wrapper.unmount();
	});

	it('restores data with setData, including the angle', async () => {
		const { wrapper, root, vm } = await mountCrop();
		vm.setData({ x: 100, y: 50, width: 200, height: 200, rotate: 90 });
		await nextTick();
		expect(wrapper.emitted('update:rotate')!.at(-1)![0]).toBe(90);
		const data = vm.getData();
		expect(data.width).toBeCloseTo(200);
		expect(data.x).toBeCloseTo(100);
		expect(data.y).toBeCloseTo(50);
		expect(isCovered(root)).toBe(true);
		// 无效数据不处理
		vm.setData({ x: 0, y: 0, width: 0, height: 0, rotate: 0 });
		expect(vm.getData().width).toBeCloseTo(200);
		wrapper.unmount();
	});

	it('draws the crop to canvas and exports images', async () => {
		const { wrapper, vm } = await mountCrop();
		expect(vm.getCanvas()).toMatchObject({ width: 400, height: 400 });
		expect(vm.getCanvas({ width: 100 })).toMatchObject({ width: 100, height: 100 });
		expect(vm.getCanvas({ height: 50 })).toMatchObject({ width: 50, height: 50 });
		const fill = vi.spyOn(contextProto(), 'fillRect');
		expect(vm.getCanvas({ width: 30, height: 20, fillColor: '#fff' })).toMatchObject({ width: 30, height: 20 });
		expect(fill).toHaveBeenCalledWith(0, 0, 30, 20);
		expect(contextProto().drawImage).toHaveBeenCalledWith(lastImage(), -400, -200, 800, 400);

		const png = await vm.getImage({ width: 10 });
		expect(png.dataURL).toMatch(/^data:image\/png/);
		expect(png.file).toBeUndefined();
		const jpeg = await vm.getImage({ width: 10, type: 'image/jpeg', quality: 0.8, filename: 'a.jpg' });
		expect(jpeg.dataURL).toMatch(/^data:image\/jpeg/);
		expect(jpeg.file).toBeInstanceOf(File);
		expect(jpeg.file.name).toBe('a.jpg');
		wrapper.unmount();
	});

	it('has no data before the image loads', async () => {
		const wrapper = mount(ImageCrop, { props: {} });
		const vm = wrapper.vm as any;
		expect(vm.getData()).toBe(null);
		expect(vm.getCanvas()).toBe(null);
		await expect(vm.getImage()).rejects.toThrow();
		vm.setData({ x: 0, y: 0, width: 1, height: 1, rotate: 0 });
		vm.reset();
		wrapper.unmount();
	});

	it('resets zoom, angle and frame', async () => {
		const { wrapper, root, vm } = await mountCrop({ rotate: 45, zoom: 2 });
		vm.reset();
		await nextTick();
		expect(wrapper.emitted('update:rotate')!.at(-1)![0]).toBe(0);
		expect(wrapper.emitted('update:zoom')!.at(-1)![0]).toBe(1);
		expect(root.classList.contains('is-animating')).toBe(true);
		expect(vm.getData()).toEqual({ x: 200, y: 0, width: 400, height: 400, rotate: 0 });
		wrapper.unmount();
	});

	it('refits when the stage resizes', async () => {
		const listeners: Array<() => void> = [];
		vi.spyOn(Resize, 'on').mockImplementation((_el: any, fn: any) => {
			listeners.push(fn);
			return () => {};
		});
		const off = vi.spyOn(Resize, 'off');
		const { wrapper, root, vm } = await mountCrop();
		const before = vm.getData();
		Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
			configurable: true,
			get() {
				return this.classList?.contains('vc-image-crop__area') ? 200 : 0;
			}
		});
		listeners.forEach(fn => fn());
		await nextTick();
		expect(numbers(root.querySelector('.vc-image-crop__frame')!)).toEqual([200, 200, 24, 80]);
		const after = vm.getData();
		Object.keys(before).forEach(key => expect(after[key]).toBeCloseTo(before[key]));
		wrapper.unmount();
		expect(off).toHaveBeenCalled();
	});
});

describe('image-crop open', () => {
	it('ImageCrop.open resolves after OK and rejects on cancel', async () => {
		const leaf = ImageCrop.open({ src: 'data:image/png;base64,a', width: 20, filename: 'a.png' });
		lastImage().load(100, 100);
		await Utils.sleep(50);
		const footer = () => [...document.querySelectorAll<HTMLElement>('.vc-image-crop-portal .vc-modal__footer button')];
		expect(document.querySelector('.vc-image-crop-portal .vc-image-crop')).not.toBe(null);
		// 旋转按钮与缩放滑块
		document.querySelectorAll<HTMLElement>('.vc-image-crop-portal__toolbar button')[1].click();
		await nextTick();
		expect(document.querySelector('.vc-image-crop-portal img')!.getAttribute('style')).toContain('rotate(90deg)');
		footer().at(-1)!.click();
		const result = await leaf;
		expect(result.dataURL).toMatch(/^data:image\/png/);
		expect(result.file!.name).toBe('a.png');
		expect(result.data).toMatchObject({ rotate: 90 });

		const cancelled = ImageCrop.open({ src: 'data:image/png;base64,b' });
		await Utils.sleep(50);
		footer()[0].click();
		await expect(cancelled).rejects.toBeUndefined();
	});

	it('MImageCrop.open resolves on done and rejects on cancel', async () => {
		const leaf = MImageCrop.open({ src: 'data:image/png;base64,a', shape: 'circle' });
		await Utils.sleep(20);
		const portal = () => document.querySelector('.vcm-image-crop-portal')!;
		expect(portal().querySelector('.vcm-image-crop .vc-image-crop__frame.is-circle')).not.toBe(null);
		const done = () => portal().querySelector<HTMLElement>('.vcm-image-crop-portal__button.is-primary')!;
		// 未加载完成时不可完成
		expect(done().classList.contains('is-disabled')).toBe(true);
		done().click();
		lastImage().load(100, 50);
		await Utils.sleep(20);
		// 旋转、还原
		portal().querySelectorAll<HTMLElement>('.vcm-image-crop-portal__tools .vcm-image-crop-portal__button')[0].click();
		await nextTick();
		expect(portal().querySelector('img')!.getAttribute('style')).toContain('rotate(-90deg)');
		portal().querySelectorAll<HTMLElement>('.vcm-image-crop-portal__tools .vcm-image-crop-portal__button')[1].click();
		await nextTick();
		expect(portal().querySelector('img')!.getAttribute('style')).toContain('rotate(0deg)');
		done().click();
		const result = await leaf;
		expect(result.data).toEqual({ x: 25, y: 0, width: 50, height: 50, rotate: 0 });

		const cancelled = MImageCrop.open({ src: 'data:image/png;base64,b' });
		await Utils.sleep(20);
		portal().querySelector<HTMLElement>('.vcm-image-crop-portal__button')!.click();
		await expect(cancelled).rejects.toBeUndefined();
	});
});
