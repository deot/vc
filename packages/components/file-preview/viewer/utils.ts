import { CLICKABLE, REVEAL_DURATION } from '../../transition/reveal';

export type { RevealRect as Rect } from '../../transition/reveal';
export type Size = { w: number; h: number };
export type Point = { x: number; y: number };

// 点在缩略图上用缩略图。点在同一项的其它位置时，缩略图只是项的开头，改从这一项开始；
// 点在按钮、链接里的文字或图标上时，与 Modal 一样从整个按钮、链接开始（取最近的一层）
export const resolveTriggerElement = (stored: Element | null, clicked: Element | null) => {
	if (clicked?.isConnected && !(stored?.isConnected && (stored === clicked || stored.contains(clicked)))) {
		return clicked.closest(`.vc-file-preview__item, ${CLICKABLE}`) ?? clicked;
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

// 读一次布局，让此前写入的样式先生效，之后的改动才有过渡
export const reflow = (el?: Element | null) => el?.getBoundingClientRect();

// 等元素自身的过渡结束或被取消，忽略子元素冒泡上来的事件；都未触发时按时长兜底
export const waitTransition = (el?: Element | null) => {
	return new Promise<void>((resolve) => {
		const done = (e?: Event) => {
			if (e && e.target !== el) return;
			el?.removeEventListener('transitionend', done);
			el?.removeEventListener('transitioncancel', done);
			clearTimeout(timer);
			resolve();
		};
		const timer = setTimeout(done, REVEAL_DURATION + 50);
		el?.addEventListener('transitionend', done);
		el?.addEventListener('transitioncancel', done);
	});
};
