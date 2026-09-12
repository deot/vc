/**
 * 滚动承载目标的判定与读取工具（carrier / registry 共用）
 */

/**
 * 是否为 Window（含 jsdom）；普通对象与元素均返回 false
 * @param target 承载目标
 * @returns 是否 Window
 */
export const isWindow = (target: object): target is Window => {
	return (target as Window).window === target;
};

/**
 * Window 实际承载滚动的元素（优先 scrollingElement，兼容旧内核回退到 documentElement）
 * @param win Window
 * @returns 滚动元素
 */
export const getScrollingElement = (win: Window) => {
	return (win.document.scrollingElement || win.document.documentElement) as HTMLElement;
};
