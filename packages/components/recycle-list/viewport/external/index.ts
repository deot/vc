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
import { ExternalCarrier, resolveExternalCarrier } from '../../../scroller/carrier';
import { registerViewport, invalidateViewport } from './registry';

const SHARED = { shared: true };

/**
 * 外部滚动源（fill=false）：主轴由最近的外部滚动祖先或 Window 承载
 *
 * 列表只是承载者里的一段内容，所以要额外知道列表根与 content 在承载者坐标系中的位置。
 * 这些位置靠 getBoundingClientRect 得到，一次滚动 / 布局里会被读取多次，因此缓存到 cache，
 * 在布局变化 / 尺寸变化 / 兄弟列表变化 / 承载者滚动时失效。
 *
 * 列表之前的内容变高或变矮（展开筛选区、图片加载等）会把列表整体推走，而列表与承载者的尺寸都不变：
 * 滚动时重新量一次即可跟上；不滚动时靠列表到承载者之间各层祖先的尺寸变化感知（见 observeAncestors）
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
	// cache 是否来自一次真实测量；之前没有测量过就无从比较平移
	private measured = false;
	private unregister?: () => void;
	private offScroll?: () => void;

	constructor(options: ViewportOptions & { root: HTMLElement }) {
		const { anchors, handlers, keys, root } = options;
		this.anchors = anchors;
		this.handlers = handlers;
		this.keys = keys;
		this.carrier = resolveExternalCarrier(root, keys);
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
	 * 布局刚更新、DOM 尚未 patch 时，根元素 rect 还是旧值，用 contentSize 兜底。
	 *
	 * 与上一次测量相比列表起点变了，说明列表之前的内容变高或变矮、把列表整体推走（滚动不改变这个坐标）。
	 * 视口起点原本落在列表里时交给组件同步平移滚动位置，与浏览器的滚动锚定一致；
	 * 在这里统一判断而不是只在祖先尺寸回调里：滚动事件可能先于回调完成重新测量，平移就会被漏掉。
	 * 共用承载者的多个列表互不重叠，只有视口起点所在的那个会平移
	 */
	private refreshBounds() {
		if (!this.dirty) return;
		const root = this.anchors.root();
		if (!root) return;
		const content = this.anchors.content();
		// 承载者只量一次，换算根与 content 共用
		const frame = this.carrier.frame;
		const list = this.carrier.getElementBounds(root, frame);
		const listStart = list.start;
		const contentStart = content ? this.carrier.getElementBounds(content, frame).start : listStart;
		const previous = this.measured ? this.cache : undefined;
		this.cache = {
			listStart,
			contentStart,
			listEnd: Math.max(list.end, contentStart + this.anchors.contentSize())
		};
		this.dirty = false;
		this.measured = true;

		if (!previous) return;
		const delta = listStart - previous.listStart;
		if (!delta) return;
		const offset = this.offset;
		if (offset >= previous.listStart && offset < previous.listEnd) {
			this.handlers.onDisplace(delta);
		}
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

	/**
	 * 监听列表到承载者之间各层祖先的尺寸（Window 承载时一直到文档根）
	 *
	 * 这些祖先随内容伸缩，列表之前的内容变化会改变它们的尺寸，以此通知组件按新位置重算可见范围；
	 * 用 Resize 的共用模式：多层同时变化由一次回调带回，只重算一次。
	 * 不改变任何一层祖先尺寸的位移（transform、祖先定高等）感知不到，留给下一次滚动或 refreshViewport()
	 */
	private observeAncestors() {
		const { onShift } = this.handlers;
		const end = this.carrier.isWindow ? null : this.target;
		for (let el = this.anchors.root()?.parentElement; el && el !== end; el = el.parentElement) {
			Resize.on(el, onShift, SHARED);
		}
	}

	bind() {
		const { onScroll, onResize } = this.handlers;
		// 每次滚动先让边界缓存失效，同一次滚动里的多次读取仍共用一次测量
		this.offScroll = this.carrier.on((e) => {
			this.markDirty();
			onScroll(e);
		});
		if (this.carrier.isWindow) {
			(this.target as Window).addEventListener('resize', onResize);
		} else {
			Resize.on(this.target as HTMLElement, onResize);
		}
		this.observeAncestors();
		this.unregister = registerViewport(this.target, this.markDirty);
		this.markDirty();
	}

	unbind() {
		const { onResize, onShift } = this.handlers;
		this.offScroll?.();
		this.offScroll = undefined;
		if (this.carrier.isWindow) {
			(this.target as Window).removeEventListener('resize', onResize);
		} else {
			Resize.off(this.target as HTMLElement, onResize);
		}
		Resize.disconnect(onShift);
		this.unregister?.();
		this.unregister = undefined;
		this.markDirty();
	}
}
