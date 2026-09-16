import { isWindow, getScrollingElement } from './dom';

type ViewportRegistry = {
	/** 被抑制 overflow-anchor 的元素；普通对象目标没有 */
	anchorElement?: HTMLElement;
	/** 抑制前的内联 overflow-anchor 值与优先级，最后一个列表解绑时还原 */
	anchorPriority: string;
	anchorValue: string;
	/** 共享该承载者的所有列表的失效回调 */
	listeners: Set<() => void>;
};

/**
 * 承载者 -> 注册表；同一 Window / 元素上可能有多个 fill=false 的列表
 */
const registries = new WeakMap<object, ViewportRegistry>();

/**
 * 需要抑制滚动锚定的元素：Window 落到其滚动元素，元素目标就是自身
 * @param target 承载目标
 * @returns 元素；普通对象返回 undefined
 */
const getAnchorElement = (target: object) => {
	if (isWindow(target)) return getScrollingElement(target);
	return (target as HTMLElement).style ? target as HTMLElement : undefined;
};

/**
 * 登记一个列表到承载者
 *
 * 首个列表登记时把承载元素的 overflow-anchor 置为 none：虚拟列表频繁改变内容尺寸，
 * 浏览器的滚动锚定会把视口"粘"到错误的位置；最后一个列表注销时还原原值
 * @param target 承载目标（Window / 元素）
 * @param invalidate 该列表的几何缓存失效回调
 * @returns 注销函数
 */
export const registerViewport = (target: object, invalidate: () => void) => {
	let registry = registries.get(target);
	if (!registry) {
		const anchorElement = getAnchorElement(target);
		registry = {
			anchorElement,
			anchorPriority: anchorElement?.style.getPropertyPriority('overflow-anchor') || '',
			anchorValue: anchorElement?.style.getPropertyValue('overflow-anchor') || '',
			listeners: new Set()
		};
		anchorElement?.style.setProperty('overflow-anchor', 'none');
		registries.set(target, registry);
	}
	registry.listeners.add(invalidate);
	return () => {
		registry!.listeners.delete(invalidate);
		if (registry!.listeners.size !== 0) return;

		const { anchorElement, anchorPriority, anchorValue } = registry!;
		// 中途被外部改写过则不还原，避免覆盖别人的样式
		if (anchorElement?.style.getPropertyValue('overflow-anchor') === 'none') {
			if (anchorValue) {
				anchorElement.style.setProperty('overflow-anchor', anchorValue, anchorPriority);
			} else {
				anchorElement.style.removeProperty('overflow-anchor');
			}
		}
		registries.delete(target);
	};
};

/**
 * 通知共享该承载者的所有列表：几何缓存失效
 *
 * 任一列表尺寸变化都会平移后续兄弟列表的位置，因此必须整体失效
 * @param target 承载目标；缺省时无操作
 */
export const invalidateViewport = (target?: object) => {
	if (!target) return;
	registries.get(target)?.listeners.forEach(invalidate => invalidate());
};
