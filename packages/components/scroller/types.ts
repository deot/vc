export type { Props as ScrollerProps } from './scroller-props';

// scrollTo 的参数：未指定的方向保持原值；duration（毫秒）大于 0 时平滑滚动
export type ScrollerScrollToOptions = {
	x?: number;
	y?: number;
	duration?: number;
};

// 组件 ref 上可用的成员（数值在 ref 上已解包）
export type ScrollerExposed = {
	wrapper: HTMLElement | undefined;
	content: HTMLElement | undefined;
	scrollLeft: number;
	scrollTop: number;
	clientWidth: number;
	clientHeight: number;
	scrollWidth: number;
	scrollHeight: number;
	refresh: () => Promise<void>;
	scrollTo: (options?: ScrollerScrollToOptions) => void;
	setScrollTop: (v: number) => void;
	setScrollLeft: (v: number) => void;
	on: (listener: (e: any) => void) => void;
	off: (listener: (e: any) => void) => void;
};
