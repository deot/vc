import { VcError } from '../vc/index';
import type { PopoverRect } from './types';
import { getViewportRect } from '../scroller/utils';

const EXTRA_DISTANCE = 4; // 额外的距离
const HALF_ARROW = 12.73 / 2; // 箭头一半的高度

// 是否支持独立的 translate 属性（不影响过渡动画使用的 transform）
const canTranslate = () => typeof CSS !== 'undefined' && !!CSS.supports?.('translate', '0 -100%');

// 可视边界（视口坐标）
type Boundary = { top: number; right: number; bottom: number; left: number };

const intersect = (a: Boundary, b: Boundary): Boundary => ({
	top: Math.max(a.top, b.top),
	right: Math.min(a.right, b.right),
	bottom: Math.min(a.bottom, b.bottom),
	left: Math.max(a.left, b.left)
});

// 滚动容器的可视区：padding box（overflow 在此裁剪）
const getPaddingBox = (el: HTMLElement): Boundary => {
	const rect = el.getBoundingClientRect();
	const top = rect.top + el.clientTop;
	const left = rect.left + el.clientLeft;
	return { top, right: left + el.clientWidth, bottom: top + el.clientHeight, left };
};

/**
 * 触发节点所在滚动容器的裁剪
 * @param scrollers 触发节点所在的滚动容器（由内到外）
 * @param triggerRect 触发节点的矩形（视口坐标）
 * @returns hidden：触发节点完全滚出容器可视区；boundary：翻转判断的边界（视口与容器可视区的交集）
 */
export const getClip = (scrollers: HTMLElement[], triggerRect: DOMRect) => {
	const viewport = getViewportRect(window);
	if (!scrollers.length) return { hidden: false, boundary: viewport };

	const clip = scrollers.map(getPaddingBox).reduce(intersect);
	const hidden = triggerRect.bottom <= clip.top
		|| triggerRect.top >= clip.bottom
		|| triggerRect.right <= clip.left
		|| triggerRect.left >= clip.right;
	return { hidden, boundary: intersect(viewport, clip) };
};

export default () => {
	const getRect = ({ portal, hasContainer, triggerEl, el }) => {
		let rect: PopoverRect;
		if (hasContainer) { // 基于传入的容器节点
			const elRect = triggerEl.getBoundingClientRect();
			const parentRect = el.parentElement.getBoundingClientRect();
			const y = elRect.y - parentRect.y;
			const x = elRect.x - parentRect.x;

			if (x < 0 || y < 0) {
				throw new VcError('popover', 'getPopupContainer选择节点应为容器元素');
			}
			rect = {
				y,
				x,
				height: elRect.height,
				width: elRect.width
			};
		} else if (!portal) { // 基于父节点
			rect = {
				y: 0,
				x: 0,
				height: triggerEl.offsetHeight,
				width: triggerEl.offsetWidth
			};
		} else {
			rect = triggerEl.getBoundingClientRect(); // 基于body（页面坐标，横纵都加上滚动距离）
			rect.y = (document?.scrollingElement?.scrollTop || 0) + rect.y;
			rect.x = (document?.scrollingElement?.scrollLeft || 0) + rect.x;
		}

		return rect || {};
	};

	const getYAssistFitPos = ({ direction, popupRect, placement, bottomDistance, bottomSurplus, topSurplus, el, boundary }) => {
		// Y轴辅助方向上的自适应
		if (direction.length === 1) {
			if (popupRect.top - boundary.top + popupRect.height / 2 < el.offsetHeight / 2) {
				placement = `${placement}-top`;
			} else if (bottomDistance < el.offsetHeight / 2) {
				placement = `${placement}-bottom`;
			}
		} else if (direction[1] === 'top' && bottomSurplus < 0 && bottomSurplus < topSurplus) {
			placement = placement.replace('top', 'bottom');
		} else if (direction[1] === 'bottom' && topSurplus < 0 && topSurplus < bottomSurplus) {
			placement = placement.replace('bottom', 'top');
		}
		return placement;
	};

	const getXAssistFitPos = ({ direction, popupRect, placement, rightDistance, leftSurplus, rightSurplus, el, boundary }) => {
		// X轴辅助方向上的自适应
		if (direction.length === 1) {
			if (popupRect.left - boundary.left + popupRect.width / 2 < el.offsetWidth / 2) {
				placement = `${placement}-left`;
			} else if (rightDistance - popupRect.width / 2 < el.offsetWidth / 2) {
				placement = `${placement}-right`;
			}
		} else if (direction[1] === 'left' && rightSurplus < 0 && rightSurplus < leftSurplus) {
			placement = placement.replace('left', 'right');
		} else if (direction[1] === 'right' && leftSurplus < 0 && leftSurplus < rightSurplus) {
			placement = placement.replace('right', 'left');
		}
		return placement;
	};

	/**
	 * 空间不足时调整方向
	 * @param options ~
	 * @param options.placement 首选方向
	 * @param options.triggerEl 触发节点
	 * @param options.el 弹层节点
	 * @param options.boundary 可视边界（视口坐标），见 getClip
	 * @returns 实际方向
	 */
	const getFitPos = ({ placement, triggerEl, el, boundary }) => {
		const popupRect = triggerEl.getBoundingClientRect();

		let remanentW: number;
		let remanentH: number;

		const direction = placement.split('-');
		const rightDistance = boundary.right - popupRect.left; // 触发节点左侧距离边界右侧的距离
		const leftDistance = popupRect.right - boundary.left; // 触发节点右侧距离边界左侧的距离
		const rightSurplus = rightDistance - el.offsetWidth; // 右侧剩余的距离
		const leftSurplus = leftDistance - el.offsetWidth; // 左侧剩余的距离

		const bottomDistance = boundary.bottom - popupRect.top; // 触发节点顶部距离边界底部的距离
		const topDistance = popupRect.bottom - boundary.top; // 触发节点底部距离边界顶部的距离
		const bottomSurplus = bottomDistance - el.offsetHeight;
		const topSurplus = topDistance - el.offsetHeight;

		switch (direction[0]) {
			case 'left':
				if (popupRect.x - boundary.left - el.offsetWidth < 0 && leftSurplus < rightSurplus) {
					placement = placement.replace('left', 'right');
				}
				placement = getYAssistFitPos({
					direction, popupRect, placement, bottomDistance, bottomSurplus, topSurplus, el, boundary
				});
				break;
			case 'right':
				remanentW = boundary.right - popupRect.x - popupRect.width - el.offsetWidth;
				if (remanentW < 0 && rightSurplus < leftSurplus) {
					placement = placement.replace('right', 'left');
				}
				placement = getYAssistFitPos({
					direction, popupRect, placement, bottomDistance, bottomSurplus, topSurplus, el, boundary
				});
				break;
			case 'top':
				// 主轴方向的自适应
				if (popupRect.y - boundary.top - el.offsetHeight < 0 && topSurplus < bottomSurplus) {
					placement = placement.replace('top', 'bottom');
				}
				placement = getXAssistFitPos({
					direction, popupRect, placement, rightDistance, leftSurplus, rightSurplus, el, boundary
				});
				break;
			case 'bottom':
				remanentH = boundary.bottom - popupRect.y - popupRect.height - el.offsetHeight;
				// 主轴方向的自适应
				if (remanentH < 0 && bottomSurplus < topSurplus) {
					placement = placement.replace('bottom', 'top');
				}
				placement = getXAssistFitPos({
					direction, popupRect, placement, rightDistance, leftSurplus, rightSurplus, el, boundary
				});
				break;
			default:
				break;
		}

		return placement;
	};
	const getPopupStyle = ({ rect, placement, triggerEl, el }) => {
		let wrapperStyle: any;
		let arrowStyle: any;
		// top / left 方向以靠近触发节点的一边定位，再用 translate 移开自身尺寸：内容长高 / 变宽时朝远离触发节点的方向伸展
		// 不支持 translate 时按原方式（减去自身尺寸）定位
		const hasTranslate = canTranslate();
		const above = hasTranslate
			? { top: `${rect.y - EXTRA_DISTANCE}px`, translate: '0 -100%' }
			: { top: `${rect.y - el.offsetHeight - EXTRA_DISTANCE}px` };
		const before = hasTranslate
			? { left: `${rect.x - EXTRA_DISTANCE}px`, translate: '-100% 0' }
			: { left: `${rect.x - el.offsetWidth - EXTRA_DISTANCE}px` };

		switch (placement) {
			case 'bottom':
				wrapperStyle = {
					top: `${rect.y + rect.height + EXTRA_DISTANCE}px`,
					left: `${rect.x + (rect.width - el.offsetWidth) / 2}px`,
					transformOrigin: `${el.offsetWidth / 2}px 0px`
				};
				break;
			case 'bottom-left':
				wrapperStyle = {
					top: `${rect.y + rect.height + EXTRA_DISTANCE}px`,
					left: `${rect.x}px`,
					transformOrigin: `16px 0px`
				};
				break;
			case 'bottom-right':
				wrapperStyle = {
					top: `${rect.y + rect.height + EXTRA_DISTANCE}px`,
					left: `${rect.x + rect.width - el.offsetWidth}px`,
					transformOrigin: `${el.offsetWidth - 16}px 0px`
				};
				break;
			case 'top':
				wrapperStyle = {
					...above,
					left: `${rect.x + (rect.width - el.offsetWidth) / 2}px`,
					transformOrigin: `${el.offsetWidth / 2}px 100%`
				};
				break;
			case 'top-left':
				wrapperStyle = {
					...above,
					left: `${rect.x}px`,
					transformOrigin: `16px 100%`
				};
				break;
			case 'top-right':
				wrapperStyle = {
					...above,
					left: `${rect.x + rect.width - el.offsetWidth}px`,
					transformOrigin: `${el.offsetWidth - 16}px 100%`
				};
				break;
			case 'right':
				wrapperStyle = {
					top: `${rect.y + (rect.height - el.offsetHeight) / 2}px`,
					left: `${rect.x + rect.width + EXTRA_DISTANCE}px`,
					transformOrigin: `0px ${el.offsetHeight / 2}px`
				};
				break;
			case 'right-top':
				wrapperStyle = {
					top: `${rect.y}px`,
					left: `${rect.x + rect.width + EXTRA_DISTANCE}px`,
					transformOrigin: `0px 12px`
				};
				arrowStyle = {
					top: `${triggerEl.offsetHeight / 2 - HALF_ARROW}px`
				};
				break;
			case 'right-bottom':
				wrapperStyle = {
					top: `${rect.y + rect.height - el.offsetHeight}px`,
					left: `${rect.x + rect.width + EXTRA_DISTANCE}px`,
					transformOrigin: `0px ${el.offsetHeight - 12}px`
				};
				arrowStyle = {
					bottom: `${triggerEl.offsetHeight / 2 - HALF_ARROW}px`
				};
				break;
			case 'left':
				wrapperStyle = {
					top: `${rect.y + (rect.height - el.offsetHeight) / 2}px`,
					...before,
					transformOrigin: `100% ${el.offsetHeight / 2}px`
				};
				break;
			case 'left-top':
				wrapperStyle = {
					top: `${rect.y}px`,
					...before,
					transformOrigin: `100% 12px`
				};
				arrowStyle = {
					top: `${triggerEl.offsetHeight / 2 - HALF_ARROW}px`
				};
				break;
			case 'left-bottom':
				wrapperStyle = {
					top: `${rect.y + rect.height - el.offsetHeight}px`,
					...before,
					transformOrigin: `100% ${el.offsetHeight - 12}px`
				};
				arrowStyle = {
					bottom: `${triggerEl.offsetHeight / 2 - HALF_ARROW}px`
				};
				break;
			default:
				break;
		}

		// 上下方向右侧超出视口时靠右（如 Cascader 展开、图片加载后变宽）；clientWidth 不含滚动条
		if (/^(top|bottom)/.test(placement)) {
			const container = el.parentElement;
			const offset = !container || container === document.body
				? -(document.scrollingElement?.scrollLeft || 0)
				: container.getBoundingClientRect().left;
			const max = (document.documentElement.clientWidth || window.innerWidth) - el.offsetWidth - offset;
			parseFloat(wrapperStyle.left) > max && (wrapperStyle.left = `${max}px`);
		}

		return {
			wrapperStyle,
			arrowStyle
		};
	};

	return {
		getYAssistFitPos,
		getXAssistFitPos,
		getPopupStyle,
		getFitPos,
		getRect
	};
};
