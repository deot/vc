import { VcError } from '../vc/index';
import type { PopoverRect } from './types';
import { getPadding } from '../scroller/utils';

const EXTRA_DISTANCE = 4; // 额外的距离
const HALF_ARROW = 12.73 / 2; // 箭头一半的高度
const VIEWPORT_GAP = 8; // 与视口边缘的留白
const ARROW_INSET = 12; // 箭头中心距弹层边缘的最小距离（避开圆角）

// 可视边界（视口坐标）
type Boundary = { top: number; right: number; bottom: number; left: number };

/**
 * 视口，不含滚动条
 * @param inset 四周内缩的距离
 * @returns 视口坐标的四边
 */
export const getViewport = (inset = 0): Boundary => {
	const { clientWidth, clientHeight } = document.documentElement;
	return {
		top: inset,
		left: inset,
		right: (clientWidth || window.innerWidth) - inset,
		bottom: (clientHeight || window.innerHeight) - inset
	};
};

// 内容区的最大宽高：实际方向所在一侧的可用空间（四周留白），扣除弹层自身的 padding（有箭头时朝向触发节点一侧留出的空间）
const getMaxSize = (placement: string, triggerRect: DOMRect, padding: { x: number; y: number }) => {
	const { right: width, bottom: height } = getViewport();
	const distance = EXTRA_DISTANCE + VIEWPORT_GAP;
	const sizes: Record<string, [number, number]> = {
		top: [width - VIEWPORT_GAP * 2, triggerRect.top - distance],
		bottom: [width - VIEWPORT_GAP * 2, height - triggerRect.bottom - distance],
		left: [triggerRect.left - distance, height - VIEWPORT_GAP * 2],
		right: [width - triggerRect.right - distance, height - VIEWPORT_GAP * 2]
	};
	const [w, h] = sizes[placement.split('-')[0]] || sizes.bottom;
	return { maxWidth: Math.max(w - padding.x, 0), maxHeight: Math.max(h - padding.y, 0) };
};

/**
 * 判断实际方向，并按该方向所在一侧的可用空间限制内容区尺寸，达到上限时内容区滚动
 * 	- 方向只在同一轴上翻转（上下 / 左右）：已达到上限时先去掉主轴上限，按内容的实际尺寸判断方向（如图片加载后变高需翻转）并恢复内容区的滚动位置；
 * 	  未达到上限时当前尺寸即实际尺寸，上限不变时不写样式
 * 	- 在计算位置前调用：位置依赖弹层尺寸，同一次计算内即可生效
 * 	- 直接写入节点样式：上限随滚动变化，避免每帧重新渲染弹层内容
 * 	- 未达到上限时保持 overflow 可见，不裁剪内容中 portal=false 的嵌套弹层
 * @param container 内容区（.vc-popover-wrapper__container）
 * @param options ~
 * @param options.el 弹层节点
 * @param options.placement 首选方向
 * @param options.triggerRect 触发节点的矩形（视口坐标）
 * @param options.fit 按当前尺寸判断实际方向
 * @returns 实际方向
 */
export const fitMaxSize = (container: HTMLElement, { el, placement, triggerRect, fit }) => {
	const { style, scrollTop, scrollLeft } = container;
	const reached = container.offsetWidth >= (parseFloat(style.maxWidth) || Infinity) - 1
		|| container.offsetHeight >= (parseFloat(style.maxHeight) || Infinity) - 1;
	if (reached) {
		/^(top|bottom)/.test(placement) ? (style.maxHeight = '') : (style.maxWidth = '');
	}

	const result: string = fit();
	const [top, right, bottom, left] = getPadding(el);
	const { maxWidth, maxHeight } = getMaxSize(result, triggerRect, { x: left + right, y: top + bottom });
	const width = `${maxWidth}px`;
	const height = `${maxHeight}px`;
	if (!reached && style.overflow !== 'auto' && style.maxWidth === width && style.maxHeight === height) return result;

	style.maxWidth = width;
	style.maxHeight = height;
	style.overflow = container.offsetWidth >= maxWidth - 1 || container.offsetHeight >= maxHeight - 1 ? 'auto' : '';
	if (reached) {
		container.scrollTop = scrollTop;
		container.scrollLeft = scrollLeft;
	}
	return result;
};

// 是否支持独立的 translate 属性（不影响过渡动画使用的 transform）
const canTranslate = () => typeof CSS !== 'undefined' && !!CSS.supports?.('translate', '0 -100%');

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
 * @returns
 * 	- hidden：触发节点完全滚出容器可视区
 * 	- viewport：视口扣掉留白与间隙，与 fitMaxSize 的上限同一口径（放得下即不会被限制）
 * 	- boundary：翻转判断的边界（viewport 与容器可视区的交集）
 */
export const getClip = (scrollers: HTMLElement[], triggerRect: DOMRect) => {
	const viewport = getViewport(VIEWPORT_GAP + EXTRA_DISTANCE);
	if (!scrollers.length) return { hidden: false, viewport, boundary: viewport };

	const clip = scrollers.map(getPaddingBox).reduce(intersect);
	const hidden = triggerRect.bottom <= clip.top
		|| triggerRect.top >= clip.bottom
		|| triggerRect.right <= clip.left
		|| triggerRect.left >= clip.right;
	return { hidden, viewport, boundary: intersect(viewport, clip) };
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

		if (!wrapperStyle) return { wrapperStyle, arrowStyle };

		// 交叉轴限制在视口内（四周留白，如 Cascader 展开、内容变宽后）：上下方向修正 left，左右方向修正 top
		// 位置被修正时，箭头改为指向触发节点中心
		const vertical = /^(top|bottom)/.test(placement);
		const key = vertical ? 'left' : 'top';
		const size = vertical ? el.offsetWidth : el.offsetHeight;
		const container = el.parentElement;
		// 弹层坐标系原点的视口坐标：挂 body 时为页面滚动的反向，否则为挂载容器的位置
		const origin = !container || container === document.body
			? -((vertical ? document.scrollingElement?.scrollLeft : document.scrollingElement?.scrollTop) || 0)
			: container.getBoundingClientRect()[key];
		const viewport = getViewport()[vertical ? 'right' : 'bottom'];
		const value = parseFloat(wrapperStyle[key]);
		const fixed = Math.max(VIEWPORT_GAP - origin, Math.min(value, viewport - VIEWPORT_GAP - size - origin));
		if (fixed !== value) {
			wrapperStyle[key] = `${fixed}px`;
			const triggerCenter = vertical ? rect.x + rect.width / 2 : rect.y + rect.height / 2;
			const center = `${Math.min(Math.max(triggerCenter - fixed, ARROW_INSET), size - ARROW_INSET)}px`;
			arrowStyle = vertical
				? { left: center, right: 'auto', transform: 'translateX(-50%) rotate(45deg)' }
				: { top: center, bottom: 'auto', transform: 'translateY(-50%) rotate(45deg)' };
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
