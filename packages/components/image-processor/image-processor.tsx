/** @jsxImportSource vue */

import { computed, defineComponent, onMounted, ref, shallowRef, watch } from 'vue';
import {
	appendTimestamp,
	isBlob,
	isDataURL,
	normalizeOutputSize
} from '../image-crop/utils';
import { props as imageProcessorProps } from './image-processor-props';

const COMPONENT_NAME = 'vc-image-processor';
const DEFAULT_OUTPUT_SIZE = 100;
const DEFAULT_TARGET_COLOR = [0, 0, 0, 1];

export type ImageProcessorOutputSize = number | [number] | [number, number];
export type ImageProcessorSource = string | Blob | File | ImageData | CanvasImageSource;
export type ImageProcessorOptions = Record<string, any>;
export type ImageEnhancer = (
	imageData: ImageData,
	options?: ImageProcessorOptions
) => ImageData | void | Promise<ImageData | void>;

type CrossOrigin = '' | 'anonymous' | 'use-credentials';
type CanvasSize = [number, number];

const normalizeColor = (color: number[] = DEFAULT_TARGET_COLOR) => {
	const normalized = [...DEFAULT_TARGET_COLOR];

	color.forEach((item, index) => {
		normalized[index] = item;
	});

	return normalized.map((item, index) => {
		const value = index === 3 && item <= 1
			? item * 255
			: item;

		return Math.min(255, Math.max(0, Math.round(value)));
	});
};

const isBlobURL = (value: string) => /^blob:/i.test(value);
const isUint8ClampedArray = (value: unknown) => {
	return Object.prototype.toString.call(value) === '[object Uint8ClampedArray]';
};
const isImageData = (value: unknown): value is ImageData => {
	return !!value
		&& typeof value === 'object'
		&& 'data' in value
		&& isUint8ClampedArray((value as ImageData).data)
		&& typeof (value as ImageData).width === 'number'
		&& typeof (value as ImageData).height === 'number';
};
const withCacheStamp = (url: string) => {
	if (isDataURL(url) || isBlobURL(url)) return url;

	return appendTimestamp(url);
};

const readBlobAsDataUrl = (blob: Blob) => {
	return new Promise<string>((resolve, reject) => {
		if (typeof FileReader === 'undefined') {
			reject(new Error('FileReader is not available.'));
			return;
		}

		const reader = new FileReader();

		reader.onload = () => resolve(String(reader.result || ''));
		reader.onerror = () => reject(reader.error || new Error('Failed to read image blob.'));
		reader.readAsDataURL(blob);
	});
};

const loadImage = (url: string, crossOrigin: CrossOrigin) => {
	return new Promise<HTMLImageElement>((resolve, reject) => {
		const image = new Image();
		const source = withCacheStamp(url);

		if (!isDataURL(source) && !isBlobURL(source) && crossOrigin !== '') {
			image.crossOrigin = crossOrigin;
		}

		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
		image.src = source;
	});
};

const getContext = (canvas: HTMLCanvasElement) => {
	const context = canvas.getContext('2d', { willReadFrequently: true });

	if (!context) {
		throw new Error('Canvas 2D context is not available.');
	}

	return context;
};

const setCanvasSize = (canvas: HTMLCanvasElement, size: CanvasSize) => {
	const [width, height] = size;

	if (canvas.width !== width) canvas.width = width;
	if (canvas.height !== height) canvas.height = height;
};

const drawSource = async (
	source: ImageProcessorSource,
	canvas: HTMLCanvasElement,
	size: CanvasSize,
	crossOrigin: CrossOrigin
) => {
	setCanvasSize(canvas, size);

	const context = getContext(canvas);
	const [width, height] = size;

	context.clearRect(0, 0, width, height);

	if (isImageData(source)) {
		context.putImageData(source, 0, 0);

		return context.getImageData(0, 0, width, height);
	}

	const imageSource = isBlob(source)
		? await loadImage(await readBlobAsDataUrl(source), crossOrigin)
		: typeof source === 'string'
			? await loadImage(source, crossOrigin)
			: source;

	context.drawImage(imageSource, 0, 0, width, height);

	return context.getImageData(0, 0, width, height);
};

const gray: ImageEnhancer = (imageData) => {
	const { data } = imageData;

	for (let i = 0; i < data.length; i += 4) {
		const value = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);

		data[i] = value;
		data[i + 1] = value;
		data[i + 2] = value;
	}

	return imageData;
};

const cutout: ImageEnhancer = (imageData, options = {}) => {
	const { data } = imageData;
	const targetColor = normalizeColor(options.targetColor);
	const tolerance = Math.max(0, Number(options.tolerance || 0));

	for (let i = 0; i < data.length; i += 4) {
		const matched = Math.abs(data[i] - targetColor[0]) <= tolerance
			&& Math.abs(data[i + 1] - targetColor[1]) <= tolerance
			&& Math.abs(data[i + 2] - targetColor[2]) <= tolerance
			&& Math.abs(data[i + 3] - targetColor[3]) <= tolerance;

		if (matched) {
			data[i + 3] = 0;
		}
	}

	return imageData;
};

const resolveEnhancer = (enhancer?: 'cutout' | 'gray' | ImageEnhancer) => {
	if (enhancer === 'gray') return gray;
	if (enhancer === 'cutout') return cutout;

	return typeof enhancer === 'function' ? enhancer : undefined;
};

const enhanceImageData = async (
	imageData: ImageData,
	enhancer: 'cutout' | 'gray' | ImageEnhancer | undefined,
	options: ImageProcessorOptions
) => {
	const resolved = resolveEnhancer(enhancer);

	if (!resolved) return imageData;

	const result = await resolved(imageData, options);

	return result || imageData;
};

const getImageData = async (
	source: ImageProcessorSource,
	outputSize: ImageProcessorOutputSize = DEFAULT_OUTPUT_SIZE,
	crossOrigin: CrossOrigin = 'anonymous'
) => {
	const canvas = document.createElement('canvas');

	return drawSource(source, canvas, normalizeOutputSize(outputSize, DEFAULT_OUTPUT_SIZE), crossOrigin);
};

const Enhancer = {
	gray,
	cutout,
	getImageData
};

export const ImageProcessor = Object.assign(defineComponent({
	name: COMPONENT_NAME,
	props: imageProcessorProps,
	emits: ['error'],
	setup(props, { emit, expose }) {
		const canvas = ref<HTMLCanvasElement | null>(null);
		const context = shallowRef<CanvasRenderingContext2D | null>(null);
		const canvasSize = computed(() => normalizeOutputSize(props.outputSize, DEFAULT_OUTPUT_SIZE));
		let requestId = 0;

		const refresh = async () => {
			const currentId = ++requestId;
			const target = canvas.value;

			if (!target) return;

			try {
				const size = canvasSize.value;

				setCanvasSize(target, size);
				context.value = getContext(target);

				if (!props.src) {
					context.value.clearRect(0, 0, size[0], size[1]);
					return;
				}

				const imageData = await drawSource(props.src, target, size, props.crossOrigin);
				const processedImageData = await enhanceImageData(imageData, props.enhancer, props.options);

				if (currentId !== requestId) return processedImageData;

				context.value = getContext(target);
				context.value.putImageData(processedImageData, 0, 0);

				return processedImageData;
			} catch (error) {
				if (currentId === requestId) {
					emit('error', error);
				}

				return;
			}
		};

		onMounted(refresh);

		watch(
			() => [props.src, props.outputSize, props.enhancer, props.options, props.crossOrigin],
			() => refresh(),
			{ deep: true }
		);

		expose({
			canvas,
			context,
			refresh
		});

		return () => {
			return (
				<canvas
					ref={canvas}
					class="vc-image-processor"
					width={canvasSize.value[0]}
					height={canvasSize.value[1]}
				/>
			);
		};
	}
}), {
	Enhancer
});
