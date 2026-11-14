import { getViewportRect } from '../../scroller/utils';
import { ExternalCarrier, getAxisKeys } from '../../scroller/carrier';
import type { SelectListAlign } from './select-list';

const Y_KEYS = getAxisKeys(true);

/**
 * 节点滚动到 Scroller 可视范围内所需的滚动量（滚动坐标）
 * @param el ~
 * @param scroller ~
 * @param align 已完整可见时为 0；否则 nearest：贴近离得近的一边，start：置顶
 * @returns 滚动量
 */
const getScrollOffset = (el: Element, scroller: HTMLElement, align: SelectListAlign = 'nearest') => {
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
	// 经承载者写入：是 VC Scroller 时交给它，自绘滚动条同步更新
	offset && new ExternalCarrier(scroller, Y_KEYS).scrollBy(offset);
};

/**
 * 原生滚动的列表：把其中的节点滚到中间；没有节点时回到顶部（MCascaderView、MSelectView 的选中项）
 * 	- 列表需为节点的 offsetParent（position 非 static）
 * @param list 列表
 * @param el 节点
 */
export const scrollToCenter = (list: HTMLElement, el?: HTMLElement | null) => {
	list.scrollTop = el ? el.offsetTop - (list.clientHeight - el.offsetHeight) / 2 : 0;
};
