/**
 * 数字 → CSS 长度：桌面端的数字为 px，移动端的数字为 750 稿
 * 双端共用的 hook 按平台选一次：const toLength = rem ? toRem : toPx;
 */

/**
 * px 长度
 * @param value px
 * @returns `${value}px`
 */
export const toPx = (value: number) => `${value}px`;

/**
 * 750 稿长度的 CSS 写法，与样式中的 remfix(n) 输出相同：随 --vc-rem 缩放（750 即屏幕宽度）
 * @param value 750 稿长度
 * @returns calc(var(--vc-rem) * value)
 */
export const toRem = (value: number) => `calc(var(--vc-rem) * ${value})`;

/**
 * 750 稿长度换算为 px（移动端组件的数字长度均为 750 稿）
 * --vc-rem 已注册（`@property`）时计算值即 px；不支持时计算值是原始表达式，挂一个探针量一次
 * @param el 读取 --vc-rem 的元素
 * @param value 750 稿长度
 * @returns px
 */
export const remToPx = (el: HTMLElement, value: number) => {
	if (!value) return 0;
	const rem = parseFloat(window.getComputedStyle(el).getPropertyValue('--vc-rem'));
	if (!Number.isNaN(rem)) return value * rem;

	const probe = document.createElement('div');
	probe.style.cssText = `position: absolute; visibility: hidden; width: ${toRem(value)}`;
	el.appendChild(probe);
	const px = probe.getBoundingClientRect().width;
	probe.remove();
	return px;
};
