import { IS_SERVER } from '@deot/vc-shared';

export type CrossOrigin = '' | 'anonymous' | 'use-credentials';

const isDataURL = (source: string) => /^\s*data:/i.test(source);

const isBlobURL = (value: string) => /^blob:/i.test(value);

export const isBlob = (source: unknown): source is Blob => {
	return !IS_SERVER && typeof Blob !== 'undefined' && source instanceof Blob;
};

const appendTimestamp = (source: string) => {
	const [base, hash = ''] = source.split('#');
	const separator = base.includes('?') ? '&' : '?';

	return `${base}${separator}_=${Date.now()}${hash ? `#${hash}` : ''}`;
};

const getFiniteSize = (value: unknown, fallback: number) => {
	const size = Number(value);
	return Number.isFinite(size) && size > 0 ? size : fallback;
};

export const normalizeOutputSize = (outputSize: number | number[], fallback: number): [number, number] => {
	if (Array.isArray(outputSize)) {
		const width = getFiniteSize(outputSize[0], fallback);
		const height = getFiniteSize(outputSize[1], width);
		return [width, height];
	}

	const size = getFiniteSize(outputSize, fallback);
	return [size, size];
};

export const readBlobAsDataUrl = (blob: Blob) => {
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

const withCacheStamp = (url: string) => {
	if (isDataURL(url) || isBlobURL(url)) return url;

	return appendTimestamp(url);
};

// stamp：追加时间戳绕过浏览器缓存（缓存里不带跨域头的响应会让跨域加载失败）
export const loadImage = (url: string, crossOrigin: CrossOrigin, stamp = true) => {
	return new Promise<HTMLImageElement>((resolve, reject) => {
		const image = new Image();
		const source = stamp ? withCacheStamp(url) : url;

		if (!isDataURL(source) && !isBlobURL(source) && crossOrigin !== '') {
			image.crossOrigin = crossOrigin;
		}

		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
		image.src = source;
	});
};
