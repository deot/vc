import { getViewportRect } from '../../scroller/utils';
import { getAxisKeys, resolveExternalCarrier } from '../../scroller/core/carrier';
import type { ExternalCarrier } from '../../scroller/core/carrier';
import type { SelectListAlign } from './select-list';

const Y_KEYS = getAxisKeys(true);

/**
 * 列表所在的纵向滚动容器（VC Scroller 或原生 overflow 滚动的元素），规则同 RecycleList 的外部滚动源；找不到时为 Window
 * @param el 列表根元素
 * @returns 承载者
 */
export const resolveListCarrier = (el: HTMLElement) => resolveExternalCarrier(el, Y_KEYS);

/**
 * 节点滚动到滚动容器可视范围内所需的滚动量（滚动坐标）
 * @param el ~
 * @param scroller ~
 * @param align nearest：已完整可见时为 0，否则贴近离得近的一边；start：已完整可见时为 0，否则置顶；
 * 	center：总是居中（比可视范围高时置顶）
 * @returns 滚动量
 */
const getScrollOffset = (el: Element, scroller: HTMLElement, align: SelectListAlign = 'nearest') => {
	const { top, bottom, scale } = getViewportRect(scroller);
	const rect = el.getBoundingClientRect();
	if (align === 'center') {
		const offset = rect.bottom - rect.top > bottom - top
			? rect.top - top
			: (rect.top + rect.bottom - top - bottom) / 2;
		return offset / scale;
	}
	const offset = rect.top < top || (align === 'start' && rect.bottom > bottom)
		? rect.top - top
		: rect.bottom > bottom ? rect.bottom - bottom : 0;
	return offset / scale;
};

/**
 * 把节点滚动到承载者的可视范围内；承载者为 Window 时不处理（不滚动页面）
 * @param el ~
 * @param carrier 见 resolveListCarrier
 * @param align 见 getScrollOffset
 */
export const scrollIntoScroller = (el: Element | null | undefined, carrier: ExternalCarrier, align: SelectListAlign = 'nearest') => {
	if (!el || carrier.isWindow) return;
	const offset = getScrollOffset(el, carrier.target as HTMLElement, align);
	// 经承载者写入：是 VC Scroller 时交给它，自绘滚动条同步更新
	offset && carrier.scrollBy(offset);
};
