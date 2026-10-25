import { getScroller } from '@deot/helper-dom';
import { SCROLLER_REG } from '../../../scroller/utils';
import { ScrollerManager } from '../../../scroller/manager';
import type { ScrollerInstance } from '../../../scroller/manager';
import type { AxisKeys } from '../types';
import { isWindow, getScrollingElement } from './dom';

/**
 * 外部滚动承载者：统一 Window / 滚动元素 / VC Scroller 的主轴读写
 *
 * 承载者是 VC Scroller 的根节点时，滚动与订阅交给其实例（见 ScrollerManager），以同步其自绘滚动条
 *
 * 只负责"承载者本身"的几何与事件，不知道列表的存在；
 * 列表相关的边界缓存见 ExternalViewport
 * 原 viewport.ts 的 ExternalViewport
 */
export class ExternalCarrier {
	target: Window | HTMLElement;
	scroller?: ScrollerInstance;
	keys: AxisKeys;

	constructor(target: Window | HTMLElement, keys: AxisKeys) {
		this.target = target;
		this.scroller = isWindow(target) ? undefined : ScrollerManager.get(target);
		this.keys = keys;
	}

	get isWindow() {
		return isWindow(this.target);
	}

	/**
	 * 主轴滚动位置
	 *
	 * Window 优先读滚动元素，为 0 时回退到 scrollY/scrollX（部分内核两者不同步）
	 * @returns 滚动位置
	 */
	get mainOffset() {
		const { axis, scrollAxis } = this.keys;
		if (!isWindow(this.target)) return this.target[scrollAxis] || 0;
		return getScrollingElement(this.target)[scrollAxis]
			|| (axis === 'y' ? this.target.scrollY : this.target.scrollX)
			|| 0;
	}

	get clientSize() {
		const { axis, clientSize } = this.keys;
		if (!isWindow(this.target)) return this.target[clientSize] || 0;
		return (axis === 'y' ? this.target.innerHeight : this.target.innerWidth)
			|| this.target.document.documentElement[clientSize]
			|| 0;
	}

	get scrollSize() {
		const { scrollSize } = this.keys;
		if (!isWindow(this.target)) return this.target[scrollSize] || 0;
		return getScrollingElement(this.target)[scrollSize] || 0;
	}

	/**
	 * 写主轴滚动位置；承载者是 VC Scroller 时交给它，以同步其自绘滚动条
	 * @param value 目标位置
	 */
	setMainOffset(value: number) {
		const { axis, scrollAxis } = this.keys;
		if (this.scroller) {
			this.scroller.scrollTo({ [axis]: value });
			return;
		}
		const el = isWindow(this.target) ? getScrollingElement(this.target) : this.target;
		el[scrollAxis] = value;
	}

	/**
	 * 订阅承载者的滚动，见 ScrollerManager.listen
	 * @param listener 滚动回调
	 * @returns 取消订阅
	 */
	on(listener: (e: any) => void) {
		return ScrollerManager.listen(this.target, listener);
	}

	/**
	 * 承载者内容区在客户区坐标中的起点与主轴缩放：Window 为 0、1；元素为自身 rect 加边框
	 * 	- 缩放来自祖先的 transform（如弹层的展开动画）：客户区中的距离除以它，才是滚动坐标中的距离
	 * @returns 起点与缩放
	 */
	get frame() {
		if (isWindow(this.target)) return { origin: 0, scale: 1 };
		const el = this.target;
		const rect = el.getBoundingClientRect();
		const vertical = this.keys.axis === 'y';
		const size = vertical ? el.offsetHeight : el.offsetWidth;
		const scale = (size && (vertical ? rect.height : rect.width) / size) || 1;
		return {
			origin: vertical ? rect.top + el.clientTop * scale : rect.left + el.clientLeft * scale,
			scale
		};
	}

	/**
	 * 承载者内容区在客户区坐标中的起点，见 frame
	 * @returns 起点
	 */
	get contentOrigin() {
		return this.frame.origin;
	}

	/**
	 * 元素在承载者滚动坐标系中的起止（已含当前滚动偏移）
	 * 原 getElementStart / getElementEnd 的公共部分
	 * @param el 目标元素
	 * @returns 起止位置
	 */
	getElementBounds(el: HTMLElement) {
		const rect = el.getBoundingClientRect();
		const { origin, scale } = this.frame;
		const base = this.mainOffset;
		return this.keys.axis === 'y'
			? { start: base + (rect.top - origin) / scale, end: base + (rect.bottom - origin) / scale }
			: { start: base + (rect.left - origin) / scale, end: base + (rect.right - origin) / scale };
	}

	getElementStart(el: HTMLElement) {
		return this.getElementBounds(el).start;
	}

	getElementEnd(el: HTMLElement) {
		return this.getElementBounds(el).end;
	}
}

/**
 * 从列表根元素向上寻找主轴滚动祖先（优先识别 VC Scroller 的 wrapper），找不到时用 Window
 * 原 resolveExternalViewport
 * @param root 列表根元素
 * @param keys 主轴键
 * @returns 承载者
 */
export const resolveExternalCarrier = (root: HTMLElement, keys: AxisKeys) => {
	const target = (getScroller(root.parentElement || root.ownerDocument.documentElement, {
		direction: keys.axis,
		className: SCROLLER_REG
	}) || root.ownerDocument.defaultView) as Window | HTMLElement;
	return new ExternalCarrier(target, keys);
};
