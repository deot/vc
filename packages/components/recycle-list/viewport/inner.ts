import type { DirectionKeys } from '../use-direction-keys';
import type { Viewport, ViewportAnchors } from './types';

/**
 * 内部滚动源（fill=true）：主轴由 RecycleList 自己的 ScrollerWheel wrapper 承载
 *
 * 列表就是滚动容器本身，因此 listStart 恒为 0、listEnd 即 scrollSize，
 * 几何不需要缓存，每次直接读 DOM
 * 原 recycle-list.tsx getViewportState 的 fill 分支
 */
export class InnerViewport implements Viewport {
	readonly external = false;

	constructor(private anchors: ViewportAnchors, private keys: DirectionKeys) {}

	private get el() {
		return this.anchors.wrapper();
	}

	get offset() {
		return this.el?.[this.keys.scrollAxis] || 0;
	}

	get clientSize() {
		return this.el?.[this.keys.clientSize] || this.anchors.fallbackClientSize() || 0;
	}

	get scrollSize() {
		return this.el?.[this.keys.scrollSize] || 0;
	}

	state() {
		if (!this.el) return;
		const viewportStart = this.offset;
		const clientSize = this.clientSize;
		return {
			viewportStart,
			viewportEnd: viewportStart + clientSize,
			clientSize,
			listStart: 0,
			listEnd: this.scrollSize,
			// content 在 wrapper 内的偏移（header 占位），item.position 以此为原点
			contentStart: this.anchors.content()?.[this.keys.offsetPosition] || 0
		};
	}

	/**
	 * 直接写 wrapper 的 scrollTop / scrollLeft；ScrollerWheel 会通过原生 scroll 事件自行同步滚动条
	 * @param value 目标位置
	 * @param force 相同值也写入
	 */
	scrollTo(value: number, force?: boolean) {
		const el = this.el;
		if (!el) return;
		if (force || el[this.keys.scrollAxis] !== value) el[this.keys.scrollAxis] = value;
	}

	invalidate() {}

	createScrollEvent() {
		return undefined;
	}

	bind() {}

	unbind() {}
}
