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

export const SCROLLER_WHEEL_REG = /vc-scroller-wheel/;
export const getScroller = (el: any) => {
	return getScroller$(el, { className: SCROLLER_WHEEL_REG });
};
export const isWheel = (el: any) => {
	return SCROLLER_WHEEL_REG.test(el?.className || '');
};
