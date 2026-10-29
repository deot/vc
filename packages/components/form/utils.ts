const EDGES = ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'] as const;
const MARGINS = ['marginLeft', 'marginRight'] as const;

const sum = (style: CSSStyleDeclaration, keys: readonly string[]) => {
	return keys.reduce((total, key) => total + (Number.parseFloat(style[key]) || 0), 0);
};

// 伪元素（如必填的`*`）占的宽度；没有内容或不显示时为0
const getPseudoWidth = (el: Element, pseudo: '::before' | '::after') => {
	const style = window.getComputedStyle(el, pseudo);
	if (!style.content || style.content === 'none' || style.content === 'normal' || style.display === 'none') return 0;
	return (Number.parseFloat(style.width) || 0) + sum(style, MARGINS);
};

/**
 * 标签的自然宽度：内层内容的宽度 + 标签格的左右内边距、边框、伪元素，向上取整
 * labelWidth为auto时使用，内层不受标签格宽度影响
 * @param target 标签内容的包裹元素
 * @returns ~
 */
export const getLabelWidth = (target: Element) => {
	const parent = target.parentElement;
	if (!parent) return 0;
	const extra = sum(window.getComputedStyle(parent), EDGES)
		+ getPseudoWidth(parent, '::before')
		+ getPseudoWidth(parent, '::after');
	return Math.ceil(target.getBoundingClientRect().width + extra);
};
