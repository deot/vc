// @vitest-environment jsdom

import { canvasToImage } from '@deot/helper-utils';
import { Resize } from '@deot/helper-resize';
import { ImageCrop, MImageCrop } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@deot/helper-utils', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@deot/helper-utils')>();
	return {
		...actual,
		canvasToImage: vi.fn(async (_canvas: HTMLCanvasElement, filename?: string) => ({
			dataURL: 'data:image/png;base64,crop',
			file: filename ? new File(['crop'], filename, { type: 'image/png' }) : undefined
		}))
	};
});

type MockContext = Partial<CanvasRenderingContext2D> & {
	canvas: HTMLCanvasElement;
	drawImage: ReturnType<typeof vi.fn>;
	clearRect: ReturnType<typeof vi.fn>;
	arc: ReturnType<typeof vi.fn>;
	fill: ReturnType<typeof vi.fn>;
	fillStyle: string;
	globalCompositeOperation: string;
};

class MockImage {
	static instances: MockImage[] = [];

	width = 400;
	height = 300;
	crossOrigin = '';
	onload: ((event: Event) => void) | null = null;
	onerror: ((event: Event) => void) | null = null;
	private _src = '';

	constructor() {
		MockImage.instances.push(this);
	}

	set src(value: string) {
		this._src = value;
	}

	get src() {
		return this._src;
	}

	triggerLoad(width = 400, height = 300) {
		this.width = width;
		this.height = height;
		this.onload?.(new Event('load'));
	}

	triggerError() {
		this.onerror?.(new Event('error'));
	}
}

class MockFileReader {
	static instances: MockFileReader[] = [];

	result: string | ArrayBuffer | null = null;
	onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
	onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;

	readAsDataURL() {
		MockFileReader.instances.push(this);
		this.result = 'data:image/png;base64,file';
		this.onload?.({ target: this } as any);
	}
}

const originalImage = window.Image;
const originalFileReader = window.FileReader;
const contexts: MockContext[] = [];

const createContext = (canvas: HTMLCanvasElement): MockContext => {
	const context = {
		canvas,
		save: vi.fn(),
		restore: vi.fn(),
		scale: vi.fn(),
		translate: vi.fn(),
		rotate: vi.fn(),
		beginPath: vi.fn(),
		rect: vi.fn(),
		arc: vi.fn(),
		lineTo: vi.fn(),
		fill: vi.fn(),
		clearRect: vi.fn(),
		drawImage: vi.fn(),
		fillStyle: '',
		globalCompositeOperation: ''
	} as unknown as MockContext;

	contexts.push(context);
	return context;
};

const flush = async () => {
	for (let i = 0; i < 3; i++) {
		await nextTick();
		await Promise.resolve();
	}
};

const createTouchEvent = (
	type: string,
	touches: Array<{ pageX: number; pageY: number }>,
	targetTouches = touches
) => {
	const event = new Event(type, {
		bubbles: true,
		cancelable: true
	});

	Object.defineProperty(event, 'touches', {
		configurable: true,
		value: touches
	});
	Object.defineProperty(event, 'targetTouches', {
		configurable: true,
		value: targetTouches
	});

	return event;
};

beforeEach(() => {
	contexts.length = 0;
	MockImage.instances = [];
	MockFileReader.instances = [];
	(window as any).Image = MockImage;
	(globalThis as any).Image = MockImage;
	(window as any).FileReader = MockFileReader;
	(globalThis as any).FileReader = MockFileReader;

	vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function getContext(this: HTMLCanvasElement) {
		return createContext(this) as unknown as CanvasRenderingContext2D;
	});
	vi.spyOn(Resize, 'on').mockImplementation(() => () => {});
	vi.spyOn(Resize, 'off').mockImplementation(() => {});
	vi.mocked(canvasToImage).mockClear();
});

afterEach(() => {
	(window as any).Image = originalImage;
	(globalThis as any).Image = originalImage;
	(window as any).FileReader = originalFileReader;
	(globalThis as any).FileReader = originalFileReader;
	vi.restoreAllMocks();
});

describe('image-crop', () => {
	it('exports desktop and mobile components', () => {
		expect(typeof ImageCrop).toBe('object');
		expect(MImageCrop).toBe(ImageCrop);
	});

	it('renders a canvas, forwards attrs, and filters width/height attrs', async () => {
		const wrapper = mount(ImageCrop, {
			attrs: {
				'class': 'custom-crop',
				'style': 'width: 320px;',
				'width': 120,
				'height': 80,
				'data-test': 'crop'
			}
		});
		await flush();

		const element = wrapper.find('canvas').element as HTMLCanvasElement;

		expect(wrapper.classes()).toContain('vc-image-crop');
		expect(wrapper.classes()).toContain('custom-crop');
		expect(wrapper.attributes('data-test')).toBe('crop');
		expect(element.width).not.toBe(120);
		expect(element.height).not.toBe(80);
		expect(element.width).toBe(790);
		expect(element.height).toBe(790);

		wrapper.unmount();
	});

	it('normalizes outputSize from number, single item array, and tuple', async () => {
		const wrapper = mount(ImageCrop, {
			props: {
				border: 0,
				outputSize: 300
			}
		});
		await flush();

		expect((wrapper.vm as any).getDimensions().canvas).toEqual({
			width: 300,
			height: 300
		});

		await wrapper.setProps({ outputSize: [420] });
		await flush();
		expect((wrapper.vm as any).getDimensions().canvas).toEqual({
			width: 420,
			height: 420
		});

		await wrapper.setProps({ outputSize: [640, 360] });
		await flush();
		expect((wrapper.vm as any).getDimensions().canvas).toEqual({
			width: 640,
			height: 360
		});

		wrapper.unmount();
	});

	it('loads a URL image and emits image-load/image-change', async () => {
		const wrapper = mount(ImageCrop, {
			props: {
				src: 'https://example.com/image.png',
				outputSize: [400, 300]
			}
		});
		await flush();

		const image = MockImage.instances[0];
		expect(image.crossOrigin).toBe('anonymous');
		expect(image.src).toContain('https://example.com/image.png');
		expect(image.src).toContain('_=');

		image.triggerLoad(800, 600);
		await flush();

		const loaded = wrapper.emitted('image-load')![0][0] as any;
		expect(loaded.width).toBe(400);
		expect(loaded.height).toBe(300);
		expect(wrapper.emitted('image-change')?.some(([type]) => type === 'image')).toBe(true);
		expect(wrapper.emitted('image-ready')).toBeUndefined();
		expect(wrapper.emitted('load-success')).toBeUndefined();

		wrapper.unmount();
	});

	it('supports query URLs, empty crossOrigin, rounded mask, and string maskColor', async () => {
		const wrapper = mount(ImageCrop, {
			props: {
				src: 'https://example.com/image.png?token=1',
				crossOrigin: '',
				border: [30, 20],
				borderRadius: 16,
				maskColor: 'rgba(1, 2, 3, 0.4)',
				outputSize: [500, 250]
			}
		});
		await flush();

		const image = MockImage.instances[0];
		expect(image.crossOrigin).toBe('');
		expect(image.src).toContain('&_=');

		image.triggerLoad(500, 100);
		await flush();

		const context = contexts.find(item => item.arc.mock.calls.length);
		expect(context?.arc).toHaveBeenCalled();
		expect(context?.fillStyle).toBe('rgba(1, 2, 3, 0.4)');

		const loaded = wrapper.emitted('image-load')![0][0] as any;
		expect(loaded.height).toBe(250);
		expect(loaded.width).toBe(1250);

		wrapper.unmount();
	});

	it('loads svg data URLs without timestamping them as remote URLs', async () => {
		const svg = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg"/>');
		const wrapper = mount(ImageCrop, {
			props: {
				src: svg
			}
		});
		await flush();

		const image = MockImage.instances[0];
		expect(image.src).toBe(svg);
		expect(image.crossOrigin).toBe('');
		expect(image.src).not.toContain('_=');

		wrapper.unmount();
	});

	it('emits image-error when URL image loading fails', async () => {
		const wrapper = mount(ImageCrop, {
			props: {
				src: 'https://example.com/broken.png'
			}
		});
		await flush();

		MockImage.instances[0].triggerError();
		await flush();

		expect(wrapper.emitted('image-error')).toHaveLength(1);
		expect(wrapper.emitted('load-failure')).toBeUndefined();

		wrapper.unmount();
	});

	it('loads Blob/File sources through FileReader', async () => {
		const file = new File(['image'], 'image.png', { type: 'image/png' });
		const wrapper = mount(ImageCrop, {
			props: {
				src: file
			}
		});
		await flush();

		expect(MockFileReader.instances).toHaveLength(1);
		expect(MockImage.instances[0].src).toBe('data:image/png;base64,file');

		MockImage.instances[0].triggerLoad(300, 300);
		await flush();

		expect(wrapper.emitted('image-load')).toHaveLength(1);
		wrapper.unmount();
	});

	it('uses canvasToImage for dataURL and file export', async () => {
		const wrapper = mount(ImageCrop, {
			props: {
				src: 'data:image/png;base64,source',
				outputSize: [400, 300]
			}
		});
		await flush();

		MockImage.instances[0].triggerLoad(800, 600);
		await flush();

		const dataURLResult = await (wrapper.vm as any).getImage();
		expect(dataURLResult.dataURL).toBe('data:image/png;base64,crop');
		expect(vi.mocked(canvasToImage).mock.calls[0]).toHaveLength(1);
		expect(contexts.some(context => context.drawImage.mock.calls.length)).toBe(true);

		const fileResult = await (wrapper.vm as any).getImage({
			filename: 'avatar',
			getFile: true
		});
		expect(fileResult.file.name).toBe('avatar');
		expect(vi.mocked(canvasToImage).mock.calls[1][1]).toBe('avatar');

		const scaled = (wrapper.vm as any).getImageScaledToCanvas();
		expect(scaled.width).toBe((wrapper.vm as any).getDimensions().width);
		expect(scaled.height).toBe((wrapper.vm as any).getDimensions().height);

		wrapper.unmount();
	});

	it('uses height-only style to derive width and supports controlled position', async () => {
		const wrapper = mount(ImageCrop, {
			props: {
				position: {
					x: 0.25,
					y: 0.75
				},
				outputSize: [400, 200],
				border: [10, 20]
			},
			attrs: {
				style: 'height: 200px;'
			}
		});
		await flush();

		Object.defineProperty(wrapper.element, 'offsetHeight', {
			configurable: true,
			get: () => 200
		});
		(wrapper.element as HTMLCanvasElement).style.removeProperty('width');
		(wrapper.vm as any).refresh();

		expect((wrapper.element as HTMLCanvasElement).style.width).toBe('340px');
		expect((wrapper.vm as any).getCroppingRect().x).toBeLessThanOrEqual(0.25);

		await wrapper.setProps({
			scale: 0.4,
			rotate: 45,
			maskColor: []
		});
		await flush();

		const rect = (wrapper.vm as any).getCroppingRect();
		expect(rect.width).toBeGreaterThan(1);
		expect(wrapper.emitted('image-change')?.some(([type]) => type === 'props')).toBe(true);

		wrapper.unmount();
	});

	it('falls back to scale 1 when scale is 0 and handles zero-size images', async () => {
		const wrapper = mount(ImageCrop, {
			props: {
				src: 'data:image/png;base64,source',
				scale: 0,
				outputSize: [400, 300]
			}
		});
		await flush();

		MockImage.instances[0].triggerLoad(0, 0);
		await flush();

		const loaded = wrapper.emitted('image-load')![0][0] as any;
		expect(loaded.width).toBe(400);
		expect(loaded.height).toBe(300);

		await wrapper.trigger('mousedown', {
			clientX: 100,
			clientY: 100
		});
		document.dispatchEvent(new MouseEvent('mousemove', { clientX: 90, clientY: 90 }));
		document.dispatchEvent(new MouseEvent('mousemove', { clientX: 80, clientY: 70 }));
		document.dispatchEvent(new MouseEvent('mouseup'));
		await flush();

		await (wrapper.vm as any).getImage({ getFile: true });
		const calls = vi.mocked(canvasToImage).mock.calls;
		expect(calls[calls.length - 1][1]).toBe('image');

		wrapper.unmount();
	});

	it('updates position while dragging and emits mouse events', async () => {
		const wrapper = mount(ImageCrop, {
			props: {
				src: 'data:image/png;base64,source',
				outputSize: [400, 300]
			}
		});
		await flush();

		MockImage.instances[0].triggerLoad(800, 600);
		await flush();

		await wrapper.trigger('mousedown', {
			clientX: 100,
			clientY: 100
		});
		document.dispatchEvent(new MouseEvent('mousemove', { clientX: 90, clientY: 90 }));
		document.dispatchEvent(new MouseEvent('mousemove', { clientX: 80, clientY: 70 }));
		document.dispatchEvent(new MouseEvent('mouseup'));
		await flush();

		expect(wrapper.emitted('position-change')?.length).toBeGreaterThan(0);
		expect(wrapper.emitted('mousemove')?.length).toBeGreaterThan(0);
		expect(wrapper.emitted('mouseup')).toHaveLength(1);

		wrapper.unmount();
	});

	it('handles touch dragging and ignores multi-touch gestures', async () => {
		const wrapper = mount(ImageCrop, {
			props: {
				src: 'data:image/png;base64,source',
				rotate: -90,
				outputSize: [400, 300]
			}
		});
		await flush();

		MockImage.instances[0].triggerLoad(800, 600);
		await flush();

		wrapper.element.dispatchEvent(createTouchEvent('touchstart', [
			{ pageX: 0, pageY: 0 },
			{ pageX: 1, pageY: 1 }
		]));
		document.dispatchEvent(createTouchEvent('touchmove', [{ pageX: 90, pageY: 90 }]));
		await flush();
		expect(wrapper.emitted('mousemove')).toBeUndefined();

		wrapper.element.dispatchEvent(createTouchEvent('touchstart', [{ pageX: 100, pageY: 100 }]));
		document.dispatchEvent(createTouchEvent('touchmove', [{ pageX: 90, pageY: 90 }]));
		document.dispatchEvent(createTouchEvent('touchmove', [{ pageX: 80, pageY: 70 }]));
		document.dispatchEvent(createTouchEvent('touchend', []));
		await flush();

		expect(wrapper.emitted('position-change')?.length).toBeGreaterThan(0);
		expect(wrapper.emitted('mouseup')).toHaveLength(1);

		wrapper.unmount();
	});

	it('ignores moves/end before dragging and handles dragover by droppable state', async () => {
		const wrapper = mount(ImageCrop);
		await flush();

		document.dispatchEvent(new MouseEvent('mousemove', { clientX: 1, clientY: 1 }));
		document.dispatchEvent(new MouseEvent('mouseup'));

		const dragover = new Event('dragover', {
			bubbles: true,
			cancelable: true
		});
		wrapper.element.dispatchEvent(dragover);
		expect(dragover.defaultPrevented).toBe(true);
		expect(wrapper.emitted('mousemove')).toBeUndefined();
		expect(wrapper.emitted('mouseup')).toBeUndefined();
		wrapper.unmount();

		const disabled = mount(ImageCrop, {
			props: {
				droppable: false
			}
		});
		await flush();

		const disabledDragover = new Event('dragover', {
			bubbles: true,
			cancelable: true
		});
		disabled.element.dispatchEvent(disabledDragover);
		expect(disabledDragover.defaultPrevented).toBe(false);
		disabled.unmount();
	});

	it('handles image-drop when droppable and ignores drop when disabled', async () => {
		const file = new File(['image'], 'drop.png', { type: 'image/png' });
		const wrapper = mount(ImageCrop);
		await flush();

		await wrapper.trigger('drop', {
			dataTransfer: {
				files: [file],
				items: []
			}
		});
		await flush();

		expect(wrapper.emitted('image-drop')).toHaveLength(1);
		expect(MockFileReader.instances).toHaveLength(1);
		expect(wrapper.emitted('drop-file')).toBeUndefined();
		wrapper.unmount();

		MockFileReader.instances = [];
		const disabled = mount(ImageCrop, {
			props: {
				droppable: false
			}
		});
		await flush();

		await disabled.trigger('drop', {
			dataTransfer: {
				files: [file],
				items: []
			}
		});
		await flush();

		expect(disabled.emitted('image-drop')).toBeUndefined();
		expect(MockFileReader.instances).toHaveLength(0);
		disabled.unmount();
	});

	it('loads image URLs from dropped HTML content', async () => {
		const wrapper = mount(ImageCrop);
		await flush();

		await wrapper.trigger('drop', {
			dataTransfer: {
				files: [],
				items: [
					{
						type: 'text/plain',
						getAsString: () => {}
					},
					{
						type: 'text/html',
						getAsString: (callback: (value: string) => void) => {
							callback('<img src="https://example.com/drop.png">');
						}
					}
				]
			}
		});
		await flush();

		expect(wrapper.emitted('image-drop')).toHaveLength(1);
		expect(MockImage.instances[0].src).toContain('https://example.com/drop.png');

		wrapper.unmount();
	});

	it('ignores dropped HTML without an image source', async () => {
		const wrapper = mount(ImageCrop);
		await flush();

		await wrapper.trigger('drop', {
			dataTransfer: {
				files: [],
				items: [
					{
						type: 'text/html',
						getAsString: (callback: (value: string) => void) => {
							callback('<div>No image</div>');
						}
					}
				]
			}
		});
		await flush();

		expect(wrapper.emitted('image-drop')).toHaveLength(1);
		expect(MockImage.instances).toHaveLength(0);

		wrapper.unmount();
	});

	it('emits image-change when src changes', async () => {
		const wrapper = mount(ImageCrop, {
			props: {
				src: 'data:image/png;base64,one'
			}
		});
		await flush();

		await wrapper.setProps({
			src: 'data:image/png;base64,two'
		});
		await flush();

		expect(MockImage.instances).toHaveLength(2);
		expect(wrapper.emitted('image-change')?.some(([type]) => type === 'src')).toBe(true);

		wrapper.unmount();
	});

	it('registers Resize and document listeners and removes them on unmount', async () => {
		const addSpy = vi.spyOn(document, 'addEventListener');
		const removeSpy = vi.spyOn(document, 'removeEventListener');
		const wrapper = mount(ImageCrop);
		await flush();

		expect(Resize.on).toHaveBeenCalledTimes(1);
		expect(addSpy).toHaveBeenCalledWith('mousemove', expect.any(Function), false);
		expect(addSpy).toHaveBeenCalledWith('mouseup', expect.any(Function), false);

		wrapper.unmount();

		expect(Resize.off).toHaveBeenCalledTimes(1);
		expect(removeSpy).toHaveBeenCalledWith('mousemove', expect.any(Function), false);
		expect(removeSpy).toHaveBeenCalledWith('mouseup', expect.any(Function), false);
	});
});
