import type { DirectionKeys } from '../hooks/use-direction-keys';
import { ExternalViewport } from './external';
import { InnerViewport } from './inner';
import type {
	InjectedScroller,
	ScrollSource,
	ViewportAnchors,
	ViewportHandlers,
	ViewportState
} from './types';

/**
 * 组件持有的滚动源
 *
 * 组件只认这一个对象，不关心当前主轴由内部 Scroller 还是外部承载者驱动；
 * fill / vertical 变化时调 rebind 换掉内部的滚动源，对象本身不替换
 */
export class Viewport {
	/**
	 * 当前滚动源；fill 决定是 InnerViewport 还是 ExternalViewport
	 */
	private source: ScrollSource;

	/**
	 * 重绑代次；只经 mark 暴露
	 */
	private epoch = 0;

	constructor(
		private anchors: ViewportAnchors,
		private handlers: ViewportHandlers,
		private keys: DirectionKeys
	) {
		this.source = new InnerViewport({ anchors, handlers, keys });
	}

	/**
	 * 主轴几何快照：视口三项在此统一计算，其余由滚动源自行测量
	 * @returns 快照；DOM 未就绪时为 undefined
	 */
	state(): ViewportState | undefined {
		const bounds = this.source.bounds();
		if (!bounds) return;
		const viewportStart = this.source.offset;
		const clientSize = this.source.clientSize;
		return { viewportStart, viewportEnd: viewportStart + clientSize, clientSize, ...bounds };
	}

	/**
	 * 主轴可滚动的最大位置；外部滚动源为承载者的绝对末端
	 * @returns 最大滚动位置，不小于 0
	 */
	get maxOffset() {
		return Math.max(0, this.source.scrollSize - this.source.clientSize);
	}

	/**
	 * 写主轴滚动位置；只写主轴，不触碰交叉轴
	 * @param value 目标位置
	 * @param force 为 true 时即使与当前值相同也写入
	 */
	scrollTo(value: number, force?: boolean) {
		if (!force && this.source.offset === value) return;
		this.source.writeOffset(value);
	}

	// 以下原样转发给当前滚动源，语义与参数说明见 ScrollSource
	get external() { return this.source.external; }
	get offset() { return this.source.offset; }
	get clientSize() { return this.source.clientSize; }
	get fillSize() { return this.source.fillSize; }
	get deferred() { return this.source.deferred; }
	invalidate() { this.source.invalidate(); }
	createScrollEvent() { return this.source.createScrollEvent(); }
	unbind() { this.source.unbind(); }
	settle() { return this.source.settle(); }
	intersects(state: ViewportState, threshold: number) { return this.source.intersects(state, threshold); }
	reachedEnd(remain: number) { return this.source.reachedEnd(remain); }
	contentOrigin(state: ViewportState) { return this.source.contentOrigin(state); }

	/**
	 * 按 fill 换掉滚动源；外部模式但根元素尚未挂载时退回内部滚动源
	 * @param external 是否使用外部滚动源（!props.fill）
	 * @param root 列表根元素；外部模式下用于向上寻找滚动祖先
	 * @param injected provide('vc-scroller') 注入的实例
	 */
	rebind(external: boolean, root?: HTMLElement, injected?: InjectedScroller) {
		const { anchors, handlers, keys } = this;
		this.source.unbind();
		this.source = external && root
			? new ExternalViewport({ anchors, handlers, keys, root, injected })
			: new InnerViewport({ anchors, handlers, keys });
		this.source.bind();
		this.epoch++;
	}

	/**
	 * 记下当前滚动源代次
	 *
	 * 异步过程跨过 await 后，滚动源可能已被 rebind 换掉，此时续算会落到新滚动源上
	 * @returns 此后发生过重绑则返回 true 的探针
	 */
	mark() {
		const epoch = this.epoch;
		return () => this.epoch !== epoch;
	}
}
