import { IS_SERVER } from '@deot/vc-shared';
import type {
	ImageCropBorder,
	ImageCropMaskColor,
	ImageCropOutputSize
} from './image-crop-props';

const DEFAULT_OUTPUT_SIZE = 750;

export const getFiniteSize = (value: unknown, fallback: number) => {
	const size = Number(value);
	return Number.isFinite(size) && size > 0 ? size : fallback;
};

export const normalizeOutputSize = (
	outputSize: ImageCropOutputSize,
	fallback = DEFAULT_OUTPUT_SIZE
): [number, number] => {
	if (Array.isArray(outputSize)) {
		const width = getFiniteSize(outputSize[0], fallback);
		const height = getFiniteSize(outputSize[1], width);
		return [width, height];
	}

	const size = getFiniteSize(outputSize, fallback);
	return [size, size];
};

export const normalizeBorder = (border: ImageCropBorder): [number, number] => {
	if (Array.isArray(border)) {
		const borderX = getFiniteSize(border[0], 0);
		const borderY = getFiniteSize(border[1], borderX);
		return [borderX, borderY];
	}

	const size = getFiniteSize(border, 0);
	return [size, size];
};

export const normalizeMaskColor = (color: ImageCropMaskColor) => {
	if (typeof color === 'string') return color;

	const [r = 0, g = 0, b = 0, a = 1] = color;
	return `rgba(${r}, ${g}, ${b}, ${a})`;
};

export const isDataURL = (source: string) => {
	return /^\s*data:/i.test(source);
};

export const appendTimestamp = (source: string) => {
	const [base, hash = ''] = source.split('#');
	const separator = base.includes('?') ? '&' : '?';

	return `${base}${separator}_=${Date.now()}${hash ? `#${hash}` : ''}`;
};

const parseHTML = (value: string) => {
	/* istanbul ignore next -- DOMParser only disappears outside browser-like runtimes. */
	if (typeof DOMParser === 'undefined') return null;
	return new DOMParser().parseFromString(value, 'text/html');
};

export const retrieveImageURL = (items: DataTransferItemList, callback: (src: string) => void) => {
	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		if (item.type === 'text/html') {
			item.getAsString((value) => {
				const doc = parseHTML(value);
				const img = doc?.querySelector('img');
				if (img?.src) {
					callback(img.src);
				}
			});
			break;
		}
	}
};

export const isBlob = (source: unknown): source is Blob => {
	return !IS_SERVER && typeof Blob !== 'undefined' && source instanceof Blob;
};

export const getPointer = (event: MouseEvent | TouchEvent) => {
	if ('targetTouches' in event && event.targetTouches.length) {
		return {
			x: event.targetTouches[0].pageX,
			y: event.targetTouches[0].pageY
		};
	}

	return {
		x: (event as MouseEvent).clientX,
		y: (event as MouseEvent).clientY
	};
};

export const drawRoundedRect = (
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	borderRadius: number
) => {
	if (borderRadius === 0) {
		context.rect(x, y, width, height);
		return;
	}

	const widthMinusRadius = width - borderRadius;
	const heightMinusRadius = height - borderRadius;

	context.translate(x, y);
	context.arc(borderRadius, borderRadius, borderRadius, Math.PI, Math.PI * 1.5);
	context.lineTo(widthMinusRadius, 0);
	context.arc(widthMinusRadius, borderRadius, borderRadius, Math.PI * 1.5, Math.PI * 2);
	context.lineTo(width, heightMinusRadius);
	context.arc(widthMinusRadius, heightMinusRadius, borderRadius, Math.PI * 2, Math.PI * 0.5);
	context.lineTo(borderRadius, height);
	context.arc(borderRadius, heightMinusRadius, borderRadius, Math.PI * 0.5, Math.PI);
	context.translate(-x, -y);
};
