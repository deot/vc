export type { Props as ScrollerProps } from './scroller-props';

// scrollTo 的参数：未指定的方向保持原值；duration（毫秒）大于 0 时平滑滚动
export type ScrollerScrollToOptions = {
	x?: number;
	y?: number;
	duration?: number;
};

export type ScrollerExposed = {
	refresh: () => void;
	scrollTo: (options?: ScrollerScrollToOptions) => void;
	setScrollTop: (v: number) => void;
	setScrollLeft: (v: number) => void;
};
