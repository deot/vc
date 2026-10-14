import { appendTimestamp, isDataURL } from '../image-crop/utils';

export type CrossOrigin = '' | 'anonymous' | 'use-credentials';

const isBlobURL = (value: string) => /^blob:/i.test(value);

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
