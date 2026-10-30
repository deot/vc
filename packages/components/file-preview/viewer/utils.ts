import type { VirtualElement } from '../../vc';
import { REVEAL_DURATION } from '../../transition/transition-reveal/reveal';

export type Size = { w: number; h: number };
export type Point = { x: number; y: number };

// 起点元素里已加载的图片：大图解码前垫在下面，和 PhotoSwipe 的 msrc 一样；替身取它对应的元素（点击位置即点中的元素）
export const thumbnailOf = (trigger: Element | VirtualElement | null) => {
	const el = trigger instanceof Element ? trigger : trigger?.contextElement;
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
