import type { DirectionKeys } from '../use-direction-keys';

/**
 * 主轴相关的 DOM 属性名映射（由 useDirectionKeys 按 vertical 生成）
 */
export type AxisKeys = Pick<DirectionKeys, 'axis' | 'scrollAxis' | 'clientSize' | 'scrollSize' | 'offsetSize'>;

/**
 * 通过 provide('vc-scroller') 注入的 VC Scroller 最小结构；
 * 命中时滚动与订阅走它，以复用 Scroller 自身的滚动条同步
 */
export type InjectedScroller = {
	wrapper?: HTMLElement;
	scrollTo?: (options: { x?: number; y?: number }) => void;
	on?: (listener: (e: any) => void) => void;
	off?: (listener: (e: any) => void) => void;
};

/**
 * 主轴几何快照：所有值均以滚动源自身的滚动坐标为原点
 *
 * - 内部滚动源（fill=true）：原点是 ScrollerWheel wrapper 的 scrollTop/Left
 * - 外部滚动源（fill=false）：原点是 Window / 外部容器的 scrollTop/Left
 */
export type ViewportState = {
	/**
	 * 视口起点，即滚动源当前的 scrollTop / scrollLeft
	 */
	viewportStart: number;
	/**
	 * 视口终点，viewportStart + clientSize
	 */
	viewportEnd: number;
	clientSize: number;
	/**
	 * 列表根元素在滚动源中的起止；内部滚动源恒为 [0, scrollSize]
	 */
	listStart: number;
	listEnd: number;
	/**
	 * content 元素起点；item.position 以它为原点
	 */
	contentStart: number;
};

/**
 * 几何快照中由滚动源自行测量的部分；视口相关的三项由 Viewport 统一计算
 */
export type Bounds = Pick<ViewportState, 'listStart' | 'listEnd' | 'contentStart'>;

/**
 * 组件提供给 Viewport 的元素访问器；全部惰性读取，避免持有过期 DOM
 */
export type ViewportAnchors = {
	/**
	 * 列表根元素（Container 渲染的最外层 div）
	 */
	root: () => HTMLElement | undefined;
	/**
	 * 内部 ScrollerWheel 的 wrapper
	 */
	wrapper: () => HTMLElement | undefined;
	/**
	 * 承载各列的 content 元素
	 */
	content: () => HTMLElement | undefined;
	/**
	 * 当前布局的主轴内容总尺寸（store.states.contentMaxSize）
	 */
	contentSize: () => number;
	/**
	 * 元素尺寸读不到（未挂载 / display:none）时的兜底 clientSize
	 */
	fallbackClientSize: () => number;
};

/**
 * 外部滚动源需要回调组件的事件
 */
export type ViewportHandlers = {
	onScroll: (e: any) => void;
	onResize: () => void;
};

/**
 * 两种滚动源统一的构造参数；各取所需，内部滚动源用不到 handlers / root / injected
 */
export type ViewportOptions = {
	anchors: ViewportAnchors;
	handlers: ViewportHandlers;
	keys: DirectionKeys;
	/**
	 * 列表根元素；仅外部滚动源需要，用于向上寻找滚动祖先
	 */
	root?: HTMLElement;
	injected?: InjectedScroller;
};

/**
 * 与 ScrollerWheel 触发的事件结构一致的假事件；target 为聚合后的滚动几何
 */
export type ScrollEventLike = {
	target: Record<string, any>;
	currentTarget: Record<string, any>;
};

/**
 * 虚拟化主轴的滚动源
 *
 * 由 InnerViewport / ExternalViewport 实现，按 fill 二选一，经 Viewport 对外；
 * 只读写主轴几何，不关心承载者是内部 ScrollerWheel 还是外部容器，
 * 交叉轴始终由内部 ScrollerWheel 承载，不经过这里
 */
export interface ScrollSource {
	/**
	 * 是否外部滚动源（fill=false）
	 */
	readonly external: boolean;
	/**
	 * 主轴滚动位置
	 */
	readonly offset: number;
	readonly clientSize: number;
	/**
	 * 判定"内容不足一屏"时用的尺寸；与 clientSize 的取法可能不同
	 */
	readonly fillSize: number;
	/**
	 * 几何是否要等 DOM patch 完成后再量
	 */
	readonly deferred: boolean;
	/**
	 * 自行测量的几何；DOM 未就绪时为 undefined，Viewport 据此返回空快照
	 */
	bounds(): Bounds | undefined;
	/**
	 * 无条件写入主轴滚动位置；是否需要写由 Viewport 判断
	 * @param value 目标位置
	 */
	writeOffset(value: number): void;
	/**
	 * 视口是否与列表相交（不相交则无需加载）
	 * @param state 已取得的几何快照
	 * @param threshold 触发阈值
	 * @returns 是否相交
	 */
	intersects(state: ViewportState, threshold: number): boolean;
	/**
	 * 距尾部阈值线的剩余距离是否已触发加载
	 * @param remain 剩余距离
	 * @returns 是否触发
	 */
	reachedEnd(remain: number): boolean;
	/**
	 * item.position 的原点在滚动源坐标系中的位置
	 * @param state 已取得的几何快照
	 * @returns 原点偏移
	 */
	contentOrigin(state: ViewportState): number;
	/**
	 * 量几何前的等待；内部滚动源无需等待
	 */
	settle(): Promise<void>;
	/**
	 * 标记几何缓存失效（外部滚动源会同时通知共享同一承载者的其他列表）
	 */
	invalidate(): void;
	/**
	 * 组装滚动事件；内部滚动源返回 undefined，直接沿用 ScrollerWheel 的事件
	 * @returns 假事件
	 */
	createScrollEvent(): ScrollEventLike | undefined;
	/**
	 * 绑定承载者的 scroll / resize 监听
	 */
	bind(): void;
	unbind(): void;
}
