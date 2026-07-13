// @vitest-environment jsdom

import { vi } from 'vitest';
import { nextTick } from 'vue';
import { ImageProcessor, MImageProcessor } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

const SVG_SOURCE = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="rgb(10,20,30)"/></svg>';
const DATA_URL = `data:image/svg+xml,${encodeURIComponent(SVG_SOURCE)}`;

const sleep = () => new Promise(resolve => setTimeout(resolve, 0));

const flush = async () => {
	await nextTick();
	await sleep();
	await nextTick();
};

const waitFor = async (assertion: () => void) => {
	let lastError: unknown;

	for (let i = 0; i < 20; i++) {
		try {
			assertion();
			return;
		} catch (error) {
			lastError = error;
			await flush();
		}
	}

	throw lastError;
};

const getContext = (canvas: HTMLCanvasElement) => {
	const context = canvas.getContext('2d', { willReadFrequently: true });

	if (!context) throw new Error('Canvas context is missing.');

	return context;
};

const createImageData = (
	pixels: number[][],
	width = pixels.length,
	height = 1
) => {
	const canvas = document.createElement('canvas');
	const context = getContext(canvas);
	const imageData = context.createImageData(width, height);

	pixels.forEach((pixel, index) => {
		const offset = index * 4;

		imageData.data[offset] = pixel[0];
		imageData.data[offset + 1] = pixel[1];
		imageData.data[offset + 2] = pixel[2];
		imageData.data[offset + 3] = pixel[3];
	});

	return imageData;
};

const createCanvasSource = (pixel: number[]) => {
	const canvas = document.createElement('canvas');
	const context = getContext(canvas);

	canvas.width = 1;
	canvas.height = 1;
	context.putImageData(createImageData([pixel]), 0, 0);

	return canvas;
};

const getPixel = (canvas: HTMLCanvasElement, x = 0, y = 0) => {
	return Array.from(getContext(canvas).getImageData(x, y, 1, 1).data);
};

const installImageMock = (pixel = [10, 20, 30, 255], shouldFail = false) => {
	const NativeImage = globalThis.Image;
	const requests: Array<{ crossOrigin: string | null; src: string }> = [];
	const ImageMock = vi.fn(function () {
		const image = createCanvasSource(pixel) as any;
		let src = '';

		image.crossOrigin = '';
		image.onload = undefined;
		image.onerror = undefined;

		Object.defineProperty(image, 'src', {
			configurable: true,
			get() {
				return src;
			},
			set(value: string) {
				src = value;
				requests.push({
					crossOrigin: image.crossOrigin,
					src: value
				});
				setTimeout(() => {
					if (shouldFail) {
						image.onerror?.();
					} else {
						image.onload?.();
					}
				}, 0);
			}
		});

		return image;
	});

	Object.defineProperty(globalThis, 'Image', {
		configurable: true,
		writable: true,
		value: ImageMock
	});

	if (typeof window !== 'undefined') {
		Object.defineProperty(window, 'Image', {
			configurable: true,
			writable: true,
			value: ImageMock
		});
	}

	return {
		requests,
		restore: () => {
			Object.defineProperty(globalThis, 'Image', {
				configurable: true,
				writable: true,
				value: NativeImage
			});

			if (typeof window !== 'undefined') {
				Object.defineProperty(window, 'Image', {
					configurable: true,
					writable: true,
					value: NativeImage
				});
			}
		}
	};
};

afterEach(() => {
	vi.restoreAllMocks();
});

describe('index.ts', () => {
	it('exports component, mobile alias and enhancer tools', () => {
		expect(typeof ImageProcessor).toBe('object');
		expect(typeof MImageProcessor).toBe('object');
		expect(typeof ImageProcessor.Enhancer.gray).toBe('function');
		expect(typeof ImageProcessor.Enhancer.cutout).toBe('function');
		expect(typeof ImageProcessor.Enhancer.getImageData).toBe('function');
	});
});

describe('image-processor.tsx', () => {
	it('renders canvas class, output size variants, and fallthrough attrs', async () => {
		const base = mount(ImageProcessor);
		expect(base.classes()).toContain('vc-image-processor');
		expect((base.element as HTMLCanvasElement).width).toBe(100);
		expect((base.element as HTMLCanvasElement).height).toBe(100);

		const square = mount(ImageProcessor, {
			props: {
				outputSize: 24
			},
			attrs: {
				'class': 'is-extra',
				'style': 'display: block;',
				'data-test': 'processor'
			}
		});
		expect(square.classes()).toContain('vc-image-processor');
		expect(square.classes()).toContain('is-extra');
		expect(square.attributes('data-test')).toBe('processor');
		expect(square.attributes('style')).toContain('display: block');
		expect((square.element as HTMLCanvasElement).width).toBe(24);
		expect((square.element as HTMLCanvasElement).height).toBe(24);

		await square.setProps({ outputSize: [25] });
		expect((square.element as HTMLCanvasElement).width).toBe(25);
		expect((square.element as HTMLCanvasElement).height).toBe(25);

		await square.setProps({ outputSize: [26, 27] });
		expect((square.element as HTMLCanvasElement).width).toBe(26);
		expect((square.element as HTMLCanvasElement).height).toBe(27);
	});

	it('draws data URLs without an enhancer', async () => {
		const imageMock = installImageMock();

		try {
			const wrapper = mount(ImageProcessor, {
				props: {
					src: DATA_URL,
					outputSize: 1
				}
			});

			await waitFor(() => {
				expect(getPixel(wrapper.element as HTMLCanvasElement)).toEqual([10, 20, 30, 255]);
			});

			expect(imageMock.requests[0].src).toBe(DATA_URL);
		} finally {
			imageMock.restore();
		}
	});

	it('sets crossOrigin and cache stamp for remote URLs', async () => {
		vi.spyOn(Date, 'now').mockReturnValue(123);
		const imageMock = installImageMock();

		try {
			const wrapper = mount(ImageProcessor, {
				props: {
					src: 'https://example.com/pixel.svg',
					outputSize: 1,
					crossOrigin: 'use-credentials'
				}
			});

			await waitFor(() => {
				expect(getPixel(wrapper.element as HTMLCanvasElement)).toEqual([10, 20, 30, 255]);
			});
			expect(imageMock.requests[0]).toEqual({
				crossOrigin: 'use-credentials',
				src: 'https://example.com/pixel.svg?_=123'
			});
		} finally {
			imageMock.restore();
		}
	});

	it('draws Blob/File sources', async () => {
		const imageMock = installImageMock();
		const source = typeof File === 'undefined'
			? new Blob([SVG_SOURCE], { type: 'image/svg+xml' })
			: new File([SVG_SOURCE], 'pixel.svg', { type: 'image/svg+xml' });

		try {
			const wrapper = mount(ImageProcessor, {
				props: {
					src: source,
					outputSize: 1
				}
			});

			await waitFor(() => {
				expect(getPixel(wrapper.element as HTMLCanvasElement)).toEqual([10, 20, 30, 255]);
			});
			expect(imageMock.requests[0].src).toContain('data:image/svg+xml');
		} finally {
			imageMock.restore();
		}
	});

	it('draws ImageData and canvas sources', async () => {
		const fromImageData = mount(ImageProcessor, {
			props: {
				src: createImageData([[30, 60, 90, 255]]),
				outputSize: 1
			}
		});
		const fromCanvas = mount(ImageProcessor, {
			props: {
				src: createCanvasSource([4, 5, 6, 255]),
				outputSize: 1
			}
		});

		await waitFor(() => {
			expect(getPixel(fromImageData.element as HTMLCanvasElement)).toEqual([30, 60, 90, 255]);
		});
		await waitFor(() => {
			expect(getPixel(fromCanvas.element as HTMLCanvasElement)).toEqual([4, 5, 6, 255]);
		});
	});

	it('applies gray and cutout enhancers with options', async () => {
		const grayWrapper = mount(ImageProcessor, {
			props: {
				src: createImageData([[10, 20, 30, 255]]),
				outputSize: 1,
				enhancer: 'gray'
			}
		});
		const cutoutWrapper = mount(ImageProcessor, {
			props: {
				src: createImageData([[11, 19, 31, 255]]),
				outputSize: 1,
				enhancer: 'cutout',
				options: {
					targetColor: [10, 20, 30, 1],
					tolerance: 2
				}
			}
		});

		await waitFor(() => {
			expect(getPixel(grayWrapper.element as HTMLCanvasElement)).toEqual([20, 20, 20, 255]);
		});
		const cutoutImageData = await (cutoutWrapper.vm as any).refresh();

		expect(Array.from(cutoutImageData.data)).toEqual([11, 19, 31, 0]);
		expect(getPixel(cutoutWrapper.element as HTMLCanvasElement)[3]).toBe(0);
	});

	it('supports sync and async custom enhancers', async () => {
		const syncEnhancer = vi.fn((imageData, options) => {
			imageData.data[0] = options.value;
		});
		const asyncEnhancer = vi.fn(async () => {
			await sleep();
			return createImageData([[7, 8, 9, 255]]);
		});

		const syncWrapper = mount(ImageProcessor, {
			props: {
				src: createImageData([[1, 2, 3, 255]]),
				outputSize: 1,
				enhancer: syncEnhancer,
				options: {
					value: 99
				}
			}
		});
		const asyncWrapper = mount(ImageProcessor, {
			props: {
				src: createImageData([[1, 2, 3, 255]]),
				outputSize: 1,
				enhancer: asyncEnhancer
			}
		});

		await waitFor(() => {
			expect(getPixel(syncWrapper.element as HTMLCanvasElement)).toEqual([99, 2, 3, 255]);
		});
		await waitFor(() => {
			expect(getPixel(asyncWrapper.element as HTMLCanvasElement)).toEqual([7, 8, 9, 255]);
		});
		expect(syncEnhancer).toHaveBeenCalledWith(expect.anything(), { value: 99 });
	});

	it('emits error when processing fails', async () => {
		const onError = vi.fn();

		mount(ImageProcessor, {
			props: {
				src: {} as any,
				outputSize: 1,
				onError
			}
		});

		await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
		expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
	});

	it('exposes canvas, context and manual refresh', async () => {
		const wrapper = mount(ImageProcessor, {
			props: {
				src: createImageData([[1, 2, 3, 255]]),
				outputSize: 1
			}
		});

		await waitFor(() => expect((wrapper.vm as any).canvas).toBeTruthy());

		expect((wrapper.vm as any).canvas).toBe(wrapper.element);
		expect((wrapper.vm as any).context).toBeTruthy();

		const imageData = await (wrapper.vm as any).refresh();
		expect(Array.from(imageData.data)).toEqual([1, 2, 3, 255]);
	});

	it('ignores stale async results after props change', async () => {
		const resolvers: Array<() => void> = [];
		const enhancer = vi.fn((imageData) => {
			return new Promise<ImageData>((resolve) => {
				resolvers.push(() => resolve(imageData));
			});
		});
		const wrapper = mount(ImageProcessor, {
			props: {
				src: createImageData([[1, 2, 3, 255]]),
				outputSize: 1,
				enhancer
			}
		});

		await waitFor(() => expect(enhancer).toHaveBeenCalledTimes(1));
		await wrapper.setProps({
			src: createImageData([[9, 8, 7, 255]])
		});
		await waitFor(() => expect(enhancer).toHaveBeenCalledTimes(2));

		resolvers[1]();
		await waitFor(() => {
			expect(getPixel(wrapper.element as HTMLCanvasElement)).toEqual([9, 8, 7, 255]);
		});

		resolvers[0]();
		await flush();
		expect(getPixel(wrapper.element as HTMLCanvasElement)).toEqual([9, 8, 7, 255]);
	});
});

describe('ImageProcessor.Enhancer', () => {
	it('gray mutates ImageData to RGB average', () => {
		const imageData = createImageData([[3, 6, 9, 255]]);

		ImageProcessor.Enhancer.gray(imageData);

		expect(Array.from(imageData.data)).toEqual([6, 6, 6, 255]);
	});

	it('cutout mutates matched pixels by targetColor and tolerance', () => {
		const imageData = createImageData([
			[10, 20, 30, 255],
			[80, 90, 100, 255]
		], 2, 1);

		ImageProcessor.Enhancer.cutout(imageData, {
			targetColor: [11, 19, 31, 1],
			tolerance: 2
		});

		expect(Array.from(imageData.data)).toEqual([
			10, 20, 30, 0,
			80, 90, 100, 255
		]);
	});

	it('getImageData draws a source into a temporary canvas', async () => {
		const imageData = await ImageProcessor.Enhancer.getImageData(
			createCanvasSource([12, 13, 14, 255]),
			1
		);

		expect(Array.from(imageData.data)).toEqual([12, 13, 14, 255]);
	});

	it('getImageData reports image load errors', async () => {
		const imageMock = installImageMock([10, 20, 30, 255], true);

		try {
			await expect(
				ImageProcessor.Enhancer.getImageData('https://example.com/fail.svg', 1)
			).rejects.toThrow('Failed to load image');
		} finally {
			imageMock.restore();
		}
	});

	it('getImageData reports FileReader errors', async () => {
		const NativeFileReader = globalThis.FileReader;

		class BrokenFileReader {
			error = new Error('reader failed');
			result = '';
			onload?: () => void;
			onerror?: () => void;

			readAsDataURL() {
				this.onerror?.();
			}
		}

		Object.defineProperty(globalThis, 'FileReader', {
			configurable: true,
			writable: true,
			value: BrokenFileReader
		});

		try {
			await expect(
				ImageProcessor.Enhancer.getImageData(new Blob([SVG_SOURCE], { type: 'image/svg+xml' }), 1)
			).rejects.toThrow('reader failed');
		} finally {
			Object.defineProperty(globalThis, 'FileReader', {
				configurable: true,
				writable: true,
				value: NativeFileReader
			});
		}
	});

	it('getImageData reports unavailable FileReader and canvas context', async () => {
		const NativeFileReader = globalThis.FileReader;
		const source = createCanvasSource([1, 2, 3, 255]);

		Object.defineProperty(globalThis, 'FileReader', {
			configurable: true,
			writable: true,
			value: undefined
		});

		try {
			await expect(
				ImageProcessor.Enhancer.getImageData(new Blob([SVG_SOURCE], { type: 'image/svg+xml' }), 1)
			).rejects.toThrow('FileReader is not available');
		} finally {
			Object.defineProperty(globalThis, 'FileReader', {
				configurable: true,
				writable: true,
				value: NativeFileReader
			});
		}

		const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

		await expect(
			ImageProcessor.Enhancer.getImageData(source, 1)
		).rejects.toThrow('Canvas 2D context is not available');

		getContextSpy.mockRestore();
	});
});
