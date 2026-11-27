import { h, shallowRef, watch, onMounted, onBeforeUnmount, onActivated, onDeactivated, Teleport } from 'vue';
import type { ShallowRef, VNode } from 'vue';
import { Resize } from '@deot/helper-resize';
import { getScale } from '../utils';
import { ScrollerManager } from './manager';
import { getAxisKeys, resolveExternalCarrier } from './carrier';
import type { ExternalCarrier } from './carrier';
import { getPortalElement } from '../../portal/utils';

const AXIS_KEYS = getAxisKeys(true);
const SHARED = { shared: true };

// 承载者在视口中的可视区，坐标相对浏览器视口（px）
export interface CarrierArea {
	top: number;
	right: number;
	bottom: number;
	left: number;
	// 可视区在视口中是否还露出
	visible: boolean;
	// 视口尺寸（不含滚动条）
	viewportWidth: number;
	viewportHeight: number;
}

/**
 * 承载者的可视区：去掉边框与滚动条，并限制在视口内；fixed 定位的悬浮元素（BackTop、FloatButton）以它为参照
 * 承载者是 window 时为视口（不含滚动条）
 * @param carrier 承载者
 * @returns 可视区四边、是否露出与视口尺寸
 */
export const getCarrierArea = (carrier: ExternalCarrier): CarrierArea => {
	const viewport = document.documentElement;
	const viewportWidth = viewport.clientWidth;
	const viewportHeight = viewport.clientHeight;
	if (carrier.isWindow) {
		return { top: 0, right: viewportWidth, bottom: viewportHeight, left: 0, visible: true, viewportWidth, viewportHeight };
	}

	const el = carrier.target as HTMLElement;
	const rect = el.getBoundingClientRect();
	const scaleX = getScale(el, 'x', rect);
	const scaleY = getScale(el, 'y', rect);
	const top = Math.max(rect.top + el.clientTop * scaleY, 0);
	const right = Math.min(rect.left + (el.clientLeft + el.clientWidth) * scaleX, viewportWidth);
	const bottom = Math.min(rect.top + (el.clientTop + el.clientHeight) * scaleY, viewportHeight);
	const left = Math.max(rect.left + el.clientLeft * scaleX, 0);
	return { top, right, bottom, left, visible: right > left && bottom > top, viewportWidth, viewportHeight };
};

export interface CarrierAreaListeners {
	// 承载者自身滚动
	scroll?: () => void;
	// 可视区可能变化：外层（含页面）滚动、承载者尺寸变化
	layout: () => void;
	// 窗口尺寸变化（以及 useCarrierArea 重新绑定时）：除可视区外还要重新量自身（如安全区）时传入，缺省用 layout
	resize?: () => void;
}

/**
 * 从锚点向上查找纵向滚动的承载者（vc Scroller / 滚动元素 / window），并监听其可视区的变化
 * @param anchor 锚点：组件在原处的节点
 * @param listeners 回调
 * @returns 承载者与解除监听的方法
 */
export const bindCarrierArea = (anchor: HTMLElement, listeners: CarrierAreaListeners) => {
	const carrier = resolveExternalCarrier(anchor, AXIS_KEYS);
	const resize = listeners.resize || listeners.layout;
	const offs: Array<() => void> = [];
	listeners.scroll && offs.push(carrier.on(listeners.scroll));
	if (!carrier.isWindow) {
		const el = carrier.target as HTMLElement;
		offs.push(ScrollerManager.subscribe(el.parentNode, listeners.layout, { window: true }).off);
		offs.push(Resize.on(el, listeners.layout, SHARED));
	}
	window.addEventListener('resize', resize);
	offs.push(() => window.removeEventListener('resize', resize));
	return {
		carrier,
		off: () => offs.forEach(fn => fn())
	};
};

export interface UseCarrierAreaOptions {
	// 挂到 body（Teleport），原处留占位节点
	portal: () => boolean;
	// 悬浮元素：不挂到 body 时作为锚点
	target: ShallowRef<HTMLElement | undefined>;
	// 占位节点的 class
	placeholderClass: string;
	listeners: CarrierAreaListeners;
	// KeepAlive 失活时（isActive() 已为 false，解除监听前）
	onDeactivated?: () => void;
}

/**
 * fixed 悬浮元素（BackTop、FloatButton）共用：查找承载者并跟随其可视区，处理 portal 与 KeepAlive
 * 	- 挂载、切换 portal、KeepAlive 激活与 refresh 时重新查找承载者，随后调用一次 resize（缺省 layout）
 * 	- KeepAlive 失活时元素留在 body 中不随页面移走：先回调 onDeactivated（由组件隐藏），再停止监听
 * @param options ~
 * @returns 承载者、是否激活、重新绑定与渲染（含 portal）的方法
 */
export const useCarrierArea = (options: UseCarrierAreaOptions) => {
	const { listeners } = options;
	const placeholder = shallowRef<HTMLElement>(); // portal 时留在原处的占位节点，从它向上查找承载者

	let carrier: ExternalCarrier | undefined;
	let off: (() => void) | undefined;
	let isActive = true;

	const unbind = () => {
		off?.();
		off = undefined;
		carrier = undefined;
	};

	const bind = () => {
		unbind();
		const anchor = options.portal() ? placeholder.value : options.target.value;
		if (!anchor) return;
		({ carrier, off } = bindCarrierArea(anchor, listeners));
		(listeners.resize || listeners.layout)();
	};

	// 切换 portal 后锚点变了，重新查找
	watch(options.portal, bind, { flush: 'post' });

	onMounted(bind);

	onDeactivated(() => {
		isActive = false;
		options.onDeactivated?.();
		unbind();
	});
	onActivated(() => {
		if (isActive) return;
		isActive = true;
		bind();
	});

	onBeforeUnmount(unbind);

	const render = (node: VNode) => {
		if (!options.portal()) return node;
		return [
			h('span', { ref: placeholder, class: options.placeholderClass }),
			h(Teleport, { to: getPortalElement() }, [node])
		];
	};

	return {
		getCarrier: () => carrier,
		isActive: () => isActive,
		refresh: bind,
		render
	};
};
