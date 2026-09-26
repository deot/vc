import { nextTick } from 'vue';
import { Resize } from '@deot/helper-resize';
import type { DirectionKeys } from '../../hooks/use-direction-keys';
import type {
	Bounds,
	ScrollEventLike,
	ScrollSource,
	ViewportAnchors,
	ViewportHandlers,
	ViewportOptions,
	ViewportState
} from '../types';
import { ExternalCarrier, resolveExternalCarrier } from './carrier';
import { registerViewport, invalidateViewport } from './registry';

/**
 * 外部滚动源（fill=false）：主轴由最近的外部滚动祖先或 Window 承载
 *
 * 列表只是承载者里的一段内容，所以要额外知道列表根与 content 在承载者坐标系中的位置。
 * 这些位置靠 getBoundingClientRect 得到，成本高且滚动中不变，因此缓存到 cache，
 * 仅在布局变化 / 尺寸变化 / 兄弟列表变化时失效
 */
export class ExternalViewport implements ScrollSource {
	readonly external = true;

	/**
	 * 边界依赖真实 DOM 尺寸，布局刚更新时要等 patch 完成再量
	 */
	readonly deferred = true;

	private carrier: ExternalCarrier;
	private anchors: ViewportAnchors;
	private handlers: ViewportHandlers;
	private keys: DirectionKeys;

	private cache: Bounds = { listStart: 0, listEnd: 0, contentStart: 0 };
	private dirty = true;
	private unregister?: () => void;

	constructor(options: ViewportOptions & { root: HTMLElement }) {
		const { anchors, handlers, keys, root, injected } = options;
		this.anchors = anchors;
		this.handlers = handlers;
		this.keys = keys;
		this.carrier = resolveExternalCarrier(root, injected, keys);
	}

	private get target() {
		return this.carrier.target;
	}

	get scrollSize() {
		return this.carrier.scrollSize;
	}

	get offset() {
		return this.carrier.mainOffset;
	}

	get clientSize() {
		return this.carrier.clientSize;
	}

	/**
	 * 承载者的视口尺寸即可见区域，与内容总尺寸口径一致
	 * @returns 尺寸
	 */
	get fillSize() {
		return this.clientSize;
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
		this.cache = {
			listStart,
			contentStart,
			listEnd: Math.max(
				this.carrier.getElementEnd(root),
				contentStart + this.anchors.contentSize()
			)
		};
		this.dirty = false;
	}

	bounds() {
		this.refreshBounds();
		return this.cache;
	}

	writeOffset(value: number) {
		this.carrier.setMainOffset(value);
	}

	/**
	 * 外部滚动源里列表只是页面的一段，视口尚未与列表相交时不该加载
	 * @param state 已取得的几何快照
	 * @param threshold 触发阈值
	 * @returns 是否相交
	 */
	intersects(state: ViewportState, threshold: number) {
		return state.viewportEnd >= state.listStart - threshold
			&& state.viewportStart <= state.listEnd + threshold;
	}

	/**
	 * 宽松判断：停在阈值线上即触发
	 * @param remain 距尾部阈值线的剩余距离
	 * @returns 是否触发
	 */
	reachedEnd(remain: number) {
		return remain <= 0;
	}

	/**
	 * item.position 以 content 为原点，需换算到承载者坐标
	 * @param state 已取得的几何快照
	 * @returns content 起点
	 */
	contentOrigin(state: ViewportState) {
		return state.contentStart;
	}

	/**
	 * 边界依赖真实 DOM 尺寸，等一次 patch 再量
	 */
	async settle() {
		await nextTick();
	}

	invalidate() {
		this.markDirty();
		invalidateViewport(this.target);
	}

	/**
	 * 组装与内部 Scroller 事件同构的假事件：主轴取承载者，交叉轴取内部 wrapper
	 * @returns 假事件；内部 wrapper 未就绪时为 undefined
	 */
	createScrollEvent(): ScrollEventLike | undefined {
		const el = this.anchors.wrapper();
		if (!el) return;
		const offset = this.offset;
		const clientSize = this.clientSize;
		const vertical = this.keys.axis === 'y';
		const delegates = {
			scrollLeft: vertical ? el.scrollLeft : offset,
			scrollTop: vertical ? offset : el.scrollTop,
			clientWidth: vertical ? el.clientWidth : clientSize,
			clientHeight: vertical ? clientSize : el.clientHeight,
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
