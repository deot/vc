import type { DirectionKeys } from '../use-direction-keys';

/**
 * 主轴相关的 DOM 属性名映射（由 useDirectionKeys 按 vertical 生成）
 */
export type AxisKeys = Pick<DirectionKeys, 'axis' | 'scrollAxis' | 'clientSize' | 'scrollSize' | 'offsetSize'>;

/**
 * 主轴几何快照：所有值均以滚动源自身的滚动坐标为原点
 *
 * - 内部滚动源（fill=true）：原点是 ScrollerWheel wrapper 的 scrollTop/Left
 * - 外部滚动源（fill=false）：原点是 Window / 外部容器的 scrollTop/Left
 */
export type ViewportState = {
	/** 视口起点，即滚动源当前的 scrollTop / scrollLeft */
	viewportStart: number;
	/** 视口终点，viewportStart + clientSize */
	viewportEnd: number;
	clientSize: number;
	/** 列表根元素在滚动源中的起止；内部滚动源恒为 [0, scrollSize] */
	listStart: number;
	listEnd: number;
	/** content 元素起点；item.position 以它为原点 */
	contentStart: number;
};

/**
 * 组件提供给 Viewport 的元素访问器；全部惰性读取，避免持有过期 DOM
 */
export type ViewportAnchors = {
	/** 列表根元素（Container 渲染的最外层 div） */
	root: () => HTMLElement | undefined;
	/** 内部 ScrollerWheel 的 wrapper */
	wrapper: () => HTMLElement | undefined;
	/** 承载各列的 content 元素 */
	content: () => HTMLElement | undefined;
	/** 当前布局的主轴内容总尺寸（store.states.contentMaxSize） */
	contentSize: () => number;
	/** 元素尺寸读不到（未挂载 / display:none）时的兜底 clientSize */
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
 * 与 ScrollerWheel 触发的事件结构一致的假事件；target 为聚合后的滚动几何
 */
export type ScrollEventLike = {
	target: Record<string, any>;
	currentTarget: Record<string, any>;
};

/**
 * 虚拟化主轴的滚动源
 *
 * 组件只通过它读写主轴几何，不关心承载者是内部 ScrollerWheel 还是外部容器；
 * 交叉轴始终由内部 ScrollerWheel 承载，不经过这里
 */
export interface Viewport {
	/** 是否外部滚动源（fill=false） */
	readonly external: boolean;
	/** 主轴滚动位置 */
	readonly offset: number;
	readonly clientSize: number;
	readonly scrollSize: number;
	/** 几何快照；DOM 未就绪时为 undefined */
	state(): ViewportState | undefined;
	/**
	 * 写主轴滚动位置；只写主轴，不触碰交叉轴
	 * @param value 目标位置
	 * @param force 为 true 时即使与当前值相同也写入
	 */
	scrollTo(value: number, force?: boolean): void;
	/** 标记几何缓存失效（外部滚动源会同时通知共享同一承载者的其他列表） */
	invalidate(): void;
	/** 组装滚动事件；内部滚动源返回 undefined，直接沿用 ScrollerWheel 的事件 */
	createScrollEvent(): ScrollEventLike | undefined;
	/** 绑定承载者的 scroll / resize 监听 */
	bind(): void;
	unbind(): void;
}
