export type Size = { w: number; h: number };
export type Point = { x: number; y: number };
export type Rect = { left: number; top: number; width: number; height: number };

// 与 _variables.scss 的 $duration 一致，只用作 transitionend 未触发时的兜底
export const DURATION = 333;

// 点在缩略图上用缩略图。点在同一项的其它位置时，缩略图只是项的开头，改从这一项开始
export const resolveTriggerElement = (stored: Element | null, clicked: Element | null) => {
	if (clicked?.isConnected && !(stored?.isConnected && (stored === clicked || stored.contains(clicked)))) {
		return clicked.closest('.vc-file-preview__item') ?? clicked;
	}
	return stored || clicked || null;
};

// 点中元素里已加载的图片：大图解码前垫在下面，和 PhotoSwipe 的 msrc 一样
export const thumbnailOf = (el: Element | null) => {
	const img = el instanceof HTMLImageElement ? el : el?.querySelector('img');
	const src = img?.currentSrc || img?.src;
	if (!img || !src || !img.naturalWidth || !img.naturalHeight) return;
	return { src, size: { w: img.naturalWidth, h: img.naturalHeight } };
};

// 元素在视口里的盒子；不在文档里或没有尺寸时为 null
export const toRect = (el?: Element | null): Rect | null => {
	if (!el?.isConnected) return null;
	const { left, top, width, height } = el.getBoundingClientRect();
	return width > 0 && height > 0 ? { left, top, width, height } : null;
};

// 视口上只露出 rect 的 clip-path。写在不缩放的容器上，四边才和画面同一条缓动
export const insetOf = (rect: Rect, viewport: Size) => {
	const right = viewport.w - rect.left - rect.width;
	const bottom = viewport.h - rect.top - rect.height;
	return `inset(${rect.top}px ${right}px ${bottom}px ${rect.left}px)`;
};

// 读一次布局，让此前写入的样式先生效，之后的改动才有过渡
export const reflow = (el?: Element | null) => el?.getBoundingClientRect();

// 等元素自身的过渡结束，忽略子元素冒泡上来的 transitionend
export const waitTransition = (el?: Element | null) => {
	return new Promise<void>((resolve) => {
		const done = (e?: Event) => {
			if (e && e.target !== el) return;
			el?.removeEventListener('transitionend', done);
			clearTimeout(timer);
			resolve();
		};
		const timer = setTimeout(done, DURATION + 50);
		el?.addEventListener('transitionend', done);
	});
};
