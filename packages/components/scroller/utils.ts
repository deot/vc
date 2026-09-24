import { getScroller as getScroller$ } from '@deot/helper-dom';

let scrollBarWidth: number;

export const getScrollBarWidth = () => {
	if (scrollBarWidth !== undefined) return scrollBarWidth;

	const outer = document.createElement('div');
	outer.className = 'vc-scrollbar__wrap';
	outer.style.visibility = 'hidden';
	outer.style.width = '100px';
	outer.style.position = 'absolute';
	outer.style.top = '-9999px';
	document.body.appendChild(outer);

	const widthNoScroll = outer.offsetWidth;
	outer.style.overflow = 'scroll';

	const inner = document.createElement('div');
	inner.style.width = '100%';
	outer.appendChild(inner);

	const widthWithScroll = inner.offsetWidth;
	outer.parentNode?.removeChild?.(outer);
	scrollBarWidth = widthNoScroll - widthWithScroll;

	return scrollBarWidth;
};

// Scroller / ScrollerWheel 的根节点即滚动容器；按 class 识别，不依赖样式是否已加载（ScrollerWheel 为 overflow: hidden）
export const SCROLLER_REG = /(?:vc-scroller-wheel|vc-scroller__wrapper)/;
export const getScroller = (el: any) => {
	return getScroller$(el, { className: SCROLLER_REG });
};

/**
 * 元素的 padding
 * @param el ~
 * @returns [上, 右, 下, 左]，单位 px
 */
export const getPadding = (el: Element) => {
	const style = getComputedStyle(el);
	return ['top', 'right', 'bottom', 'left'].map(key => parseFloat(style.getPropertyValue(`padding-${key}`)) || 0);
};

/**
 * 滚动容器的可视区：去掉边框与 padding 后的区域（即 position: sticky 的参照区域），坐标相对浏览器视口
 * 祖先存在 transform: scale 时，边框与 padding 按同一比例换算，scale 用于把 CSS px 换算为视口 px
 * @param el 滚动容器或 window
 * @returns 可视区四边与缩放比例
 */
export const getViewportRect = (el: HTMLElement | Window) => {
	// 不用 instanceof Window：jsdom 等环境下全局 window 是代理，instanceof 不成立
	if ((el as Window).window === el) {
		const win = el as Window;
		return { top: 0, right: win.innerWidth, bottom: win.innerHeight, left: 0, scale: 1 };
	}
	el = el as HTMLElement;
	const rect = el.getBoundingClientRect();
	const scale = el.offsetHeight ? rect.height / el.offsetHeight : 1;
	const [paddingTop, paddingRight, paddingBottom, paddingLeft] = getPadding(el);
	const top = rect.top + (el.clientTop + paddingTop) * scale;
	const left = rect.left + (el.clientLeft + paddingLeft) * scale;
	return {
		top,
		right: left + (el.clientWidth - paddingLeft - paddingRight) * scale,
		bottom: top + (el.clientHeight - paddingTop - paddingBottom) * scale,
		left,
		scale
	};
};
