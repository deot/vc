import type { DirectionKeys } from '../use-direction-keys';
import { ExternalCarrier, resolveExternalCarrier } from './carrier';
import type { InjectedScroller } from './carrier';
import { ExternalViewport } from './external';
import { InnerViewport } from './inner';
import { registerViewport, invalidateViewport } from './registry';
import type { Viewport, ViewportAnchors, ViewportHandlers } from './types';

export type {
	AxisKeys,
	ScrollEventLike,
	Viewport,
	ViewportAnchors,
	ViewportHandlers,
	ViewportState
} from './types';
export type { InjectedScroller };
export {
	ExternalCarrier,
	ExternalViewport,
	InnerViewport,
	resolveExternalCarrier,
	registerViewport,
	invalidateViewport
};

type CreateViewportOptions = {
	/** 是否使用外部滚动源（!props.fill） */
	external: boolean;
	/** 列表根元素；外部模式下用于向上寻找滚动祖先，缺省则退回内部滚动源 */
	root?: HTMLElement;
	injected?: InjectedScroller;
	keys: DirectionKeys;
	anchors: ViewportAnchors;
	handlers: ViewportHandlers;
};

/**
 * 按 fill 创建滚动源；外部模式但根元素尚未挂载时退回内部滚动源
 * @param options 创建选项
 * @returns 滚动源（未 bind）
 */
export const createViewport = (options: CreateViewportOptions): Viewport => {
	const { external, root, injected, keys, anchors, handlers } = options;
	if (!external || !root) return new InnerViewport(anchors, keys);
	return new ExternalViewport(resolveExternalCarrier(root, injected, keys), anchors, handlers);
};
