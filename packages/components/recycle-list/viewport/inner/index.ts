import type { DirectionKeys } from '../../hooks/use-direction-keys';
import type { Bounds, ScrollSource, ViewportAnchors, ViewportOptions } from '../types';

/**
 * 内部滚动源（fill=true）：主轴由 RecycleList 自己的 ScrollerWheel wrapper 承载
 *
 * 列表就是滚动容器本身，因此 listStart 恒为 0、listEnd 即 scrollSize，
 * 几何不需要缓存，每次直接读 DOM
 */
export class InnerViewport implements ScrollSource {
	readonly external = false;

	/**
	 * 列表即滚动容器，几何随 DOM 同步，无需等 patch
	 */
	readonly deferred = false;

	private anchors: ViewportAnchors;
	private keys: DirectionKeys;

	constructor(options: ViewportOptions) {
		this.anchors = options.anchors;
		this.keys = options.keys;
	}

	private get el() {
		return this.anchors.wrapper();
	}

	private get scrollSize() {
		return this.el?.[this.keys.scrollSize] || 0;
	}

	get offset() {
		return this.el?.[this.keys.scrollAxis] || 0;
	}

	get clientSize() {
		return this.el?.[this.keys.clientSize] || this.anchors.fallbackClientSize() || 0;
	}

	/**
	 * 不足一屏判定用 offsetSize（含边框），与内容总尺寸的口径一致
	 * @returns 尺寸
	 */
	get fillSize() {
		return this.el?.[this.keys.offsetSize] || 0;
	}

	bounds(): Bounds | undefined {
		if (!this.el) return;
		return {
			listStart: 0,
			listEnd: this.scrollSize,
			// content 在 wrapper 内的偏移（header 占位），item.position 以此为原点
			contentStart: this.anchors.content()?.[this.keys.offsetPosition] || 0
		};
	}

	/**
	 * 直接写 wrapper 的 scrollTop / scrollLeft；ScrollerWheel 会通过原生 scroll 事件自行同步滚动条
	 * @param value 目标位置
	 */
	writeOffset(value: number) {
		const el = this.el;
		if (el) el[this.keys.scrollAxis] = value;
	}

	/**
	 * 列表就是滚动容器，永远处于视口内
	 * @returns 恒为 true
	 */
	intersects() {
		return true;
	}

	/**
	 * 严格判断：恰好停在阈值线上不触发
	 * @param remain 距尾部阈值线的剩余距离
	 * @returns 是否触发
	 */
	reachedEnd(remain: number) {
		return remain < 0;
	}

	/**
	 * 滚动坐标即 content 坐标，无需换算
	 * @returns 恒为 0
	 */
	contentOrigin() {
		return 0;
	}

	async settle() {}

	invalidate() {}

	createScrollEvent() {
		return undefined;
	}

	bind() {}

	unbind() {}
}
