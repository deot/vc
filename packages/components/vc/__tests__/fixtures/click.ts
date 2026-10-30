/**
 * 视口里的盒子，测试里给元素的 getBoundingClientRect 用
 * @param left 左
 * @param top 上
 * @param width 宽
 * @param height 高
 * @returns 盒子
 */
export const rectOf = (left: number, top: number, width: number, height: number) => ({
	x: left,
	y: top,
	left,
	top,
	width,
	height,
	right: left + width,
	bottom: top + height,
	toJSON() { return {}; }
}) as DOMRect;

/**
 * 像鼠标一样点在 target 的中心：有尺寸时带上点下的坐标，之后打开的弹层从它展开（需先给它尺寸）
 * @param target 点击的目标；null 表示点在页面空白处，清掉最近一次点击
 */
export const clickOn = (target: Element | null) => {
	const el = target || document.body;
	const { left, top, width, height } = el.getBoundingClientRect();
	const point = width && height ? { detail: 1, clientX: left + width / 2, clientY: top + height / 2 } : {};
	el.dispatchEvent(new MouseEvent('click', { bubbles: true, ...point }));
};
