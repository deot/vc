import { getViewportRect } from '../../scroller/utils';
import { ScrollerManager } from '../../scroller/manager';
import type { SelectListAlign } from './select-list';

/**
 * 节点滚动到 Scroller 可视范围内所需的滚动量（滚动坐标）
 * @param el ~
 * @param scroller ~
 * @param align 已完整可见时为 0；否则 nearest：贴近离得近的一边，start：置顶
 * @returns 滚动量
 */
export const getScrollOffset = (el: Element, scroller: HTMLElement, align: SelectListAlign = 'nearest') => {
	const { top, bottom, scale } = getViewportRect(scroller);
	const rect = el.getBoundingClientRect();
	const offset = rect.top < top || (align === 'start' && rect.bottom > bottom)
		? rect.top - top
		: rect.bottom > bottom ? rect.bottom - bottom : 0;
	return offset / scale;
};

/**
 * 把节点滚动到其所在 Scroller 的可视范围内；只调整该容器，不滚动页面
 * @param el ~
 * @param align 见 getScrollOffset
 */
export const scrollIntoScroller = (el?: Element | null, align: SelectListAlign = 'nearest') => {
	const scroller = el?.closest<HTMLElement>('.vc-scroller');
	if (!el || !scroller) return;
	const offset = getScrollOffset(el, scroller, align);
	if (!offset) return;

	// 经 Scroller 写入：自绘滚动条同步更新
	const y = scroller.scrollTop + offset;
	const instance = ScrollerManager.get(scroller);
	instance ? instance.scrollTo({ y }) : (scroller.scrollTop = y);
};
