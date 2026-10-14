import { vi } from 'vitest';

/**
 * 用 create 返回的对象（如一块画布）充当 Image：
 * 记录每次请求的 src 与 crossOrigin，赋值 src 后异步触发 onload / onerror
 * @param create 每次 new Image() 时调用
 * @param shouldFail 是否加载失败，可按 src 判断
 * @returns ~
 */
export const installImageMock = (
	create: () => any,
	shouldFail: boolean | ((src: string) => boolean) = false
) => {
	const requests: Array<{ crossOrigin: string | null; src: string }> = [];

	vi.stubGlobal('Image', function () {
		const image = create();
		let src = '';

		image.crossOrigin = '';
		Object.defineProperty(image, 'src', {
			configurable: true,
			get: () => src,
			set(value: string) {
				const isFailed = typeof shouldFail === 'function' ? shouldFail(value) : shouldFail;

				src = value;
				requests.push({ crossOrigin: image.crossOrigin, src: value });
				setTimeout(() => (isFailed ? image.onerror?.() : image.onload?.()), 0);
			}
		});

		return image;
	});

	return {
		requests,
		restore: () => vi.unstubAllGlobals()
	};
};
