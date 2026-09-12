import { Resize } from '@deot/helper-resize';
import type { ExternalCarrier } from './carrier';
import { registerViewport, invalidateViewport } from './registry';
import type { Viewport, ViewportAnchors, ViewportHandlers, ViewportState } from './types';

type Bounds = Pick<ViewportState, 'listStart' | 'listEnd' | 'contentStart'>;

/**
 * 外部滚动源（fill=false）：主轴由最近的外部滚动祖先或 Window 承载
 *
 * 列表只是承载者里的一段内容，所以要额外知道列表根与 content 在承载者坐标系中的位置。
 * 这些位置靠 getBoundingClientRect 得到，成本高且滚动中不变，因此缓存到 bounds，
 * 仅在布局变化 / 尺寸变化 / 兄弟列表变化时失效
 * 原 recycle-list.tsx 中 externalViewport + bounds + refreshBounds + bind/unbindExternalViewport
 */
export class ExternalViewport implements Viewport {
	readonly external = true;

	private bounds: Bounds = { listStart: 0, listEnd: 0, contentStart: 0 };
	private dirty = true;
	private unregister?: () => void;

	constructor(
		readonly carrier: ExternalCarrier,
		private anchors: ViewportAnchors,
		private handlers: ViewportHandlers
	) {}

	get target() {
		return this.carrier.target;
	}

	get offset() {
		return this.carrier.mainOffset;
	}

	get clientSize() {
		return this.carrier.clientSize;
	}

	get scrollSize() {
		return this.carrier.scrollSize;
	}

	/**
	 * 只标记本列表缓存失效；登记到 registry 的就是它，避免广播时递归
	 */
	private markDirty = () => {
		this.dirty = true;
	};

	/**
	 * 重新量列表根与 content 的位置
	 *
	 * listEnd 取"根元素底部"与"content 起点 + 内容总尺寸"的较大者：
	 * 布局刚更新、DOM 尚未 patch 时，根元素 rect 还是旧值，用 contentSize 兜底
	 */
	private refreshBounds() {
		if (!this.dirty) return;
		const root = this.anchors.root();
		if (!root) return;
		const content = this.anchors.content();
		const listStart = this.carrier.getElementStart(root);
		const contentStart = content ? this.carrier.getElementStart(content) : listStart;
		this.bounds = {
			listStart,
			contentStart,
			listEnd: Math.max(
				this.carrier.getElementEnd(root),
				contentStart + this.anchors.contentSize()
			)
		};
		this.dirty = false;
	}

	state(): ViewportState {
		this.refreshBounds();
		const viewportStart = this.offset;
		const clientSize = this.clientSize;
		return {
			viewportStart,
			viewportEnd: viewportStart + clientSize,
			clientSize,
			...this.bounds
		};
	}

	scrollTo(value: number, force?: boolean) {
		if (force || this.offset !== value) this.carrier.setMainOffset(value);
	}

	invalidate() {
		this.markDirty();
		invalidateViewport(this.target);
	}

	/**
	 * 组装与 ScrollerWheel 事件同构的假事件：主轴取承载者，交叉轴取内部 wrapper
	 * 原 recycle-list.tsx createScrollEvent
	 * @returns 假事件；内部 wrapper 未就绪时为 undefined
	 */
	createScrollEvent() {
		const el = this.anchors.wrapper();
		if (!el) return;
		const state = this.state();
		const vertical = this.carrier.keys.axis === 'y';
		const delegates = {
			scrollLeft: vertical ? el.scrollLeft : state.viewportStart,
			scrollTop: vertical ? state.viewportStart : el.scrollTop,
			clientWidth: vertical ? el.clientWidth : state.clientSize,
			clientHeight: vertical ? state.clientSize : el.clientHeight,
			scrollWidth: vertical ? el.scrollWidth : (this.scrollSize || el.scrollWidth),
			scrollHeight: vertical ? (this.scrollSize || el.scrollHeight) : el.scrollHeight,
			getBoundingClientRect: () => el.getBoundingClientRect()
		};
		return { target: delegates, currentTarget: delegates };
	}

	bind() {
		const { onScroll, onResize } = this.handlers;
		this.carrier.on(onScroll);
		if (this.carrier.isWindow) {
			(this.target as Window).addEventListener('resize', onResize);
		} else {
			Resize.on(this.target as HTMLElement, onResize);
		}
		this.unregister = registerViewport(this.target, this.markDirty);
		this.markDirty();
	}

	unbind() {
		const { onScroll, onResize } = this.handlers;
		this.carrier.off(onScroll);
		if (this.carrier.isWindow) {
			(this.target as Window).removeEventListener('resize', onResize);
		} else {
			Resize.off(this.target as HTMLElement, onResize);
		}
		this.unregister?.();
		this.unregister = undefined;
		this.markDirty();
	}
}
