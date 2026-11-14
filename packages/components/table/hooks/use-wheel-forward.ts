import { onUnmounted, watch } from 'vue';
import type { Ref } from 'vue';
import { bindWheel } from '../../scroller/core/wheel';

type Options = {
	headerWrapper: Ref<any>;
	bottomWrapper: Ref<any>;
	// 表体的 Scroller 实例
	bodyScroller: Ref<any>;
};

/**
 * 在表头 / 底部 dock（横向滚动条 + 合计行）上滚动滚轮时，把滚动转交给表体
 *
 * 跟随元素绑定：dock 与表体同一次渲染出现、随 affix 切换重建，只在挂载时绑定一次会错过或丢失
 * @param options 相关元素与表体 Scroller
 */
export const useWheelForward = (options: Options) => {
	const { headerWrapper, bottomWrapper, bodyScroller } = options;

	// 元素 -> 解除监听；元素变化时解绑旧的、绑定新的
	const bound = new Map<HTMLElement, () => void>();
	const sync = (els: Array<HTMLElement | null | undefined>) => {
		const next = new Set(els.filter(Boolean) as HTMLElement[]);
		bound.forEach((unbind, el) => {
			if (next.has(el)) return;
			unbind();
			bound.delete(el);
		});
		next.forEach((el) => {
			!bound.has(el) && bound.set(el, bindWheel(el, () => bodyScroller.value));
		});
	};

	watch(
		() => [headerWrapper.value, bottomWrapper.value],
		sync,
		{ flush: 'post', immediate: true }
	);

	onUnmounted(() => sync([]));
};
