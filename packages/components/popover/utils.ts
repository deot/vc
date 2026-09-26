import { composedPath } from '@deot/helper-dom';
import { getPadding } from '../scroller/utils';

/**
 * 弹层节点 → 触发节点
 * 弹层默认挂在 body 下，DOM 上不在触发节点内，据此找回它在页面结构中的位置
 */
const triggers = new WeakMap<Node, Element>();

export const setTrigger = (el: Element, triggerEl: Element) => {
	triggers.set(el, triggerEl);
};

const getAncestors = (node?: Node | null) => {
	const path: Node[] = [];
	while (node) {
		path.push(node);
		node = node.parentNode;
	}
	return path;
};

/**
 * 事件是否发生在 area 内（含嵌套的子弹层）
 * 	- 落在已登记的弹层内时，改用该弹层的触发节点继续判断（可多层）
 * 	- 如：Select 下拉打开时，点击标签列表弹层（挂 body，触发节点在 Select 内）视为点在 Select 内
 * @param e 事件（按事件路径判断，目标节点可能随后被移除）
 * @param area 区域节点
 * @returns ~
 */
export const isInArea = (e: Event, area: Element) => {
	let path = composedPath(e) as Node[];
	const seen = new Set<Node>();
	while (!path.includes(area)) {
		const popup = path.find(node => triggers.has(node) && !seen.has(node));
		if (!popup) return false;
		seen.add(popup);
		path = getAncestors(triggers.get(popup));
	}
	return true;
};

/**
 * 按弹层的实际字体（可被 CSS 变量覆盖），测量文字排成一行时的尺寸
 * 	- 临时插入与弹层相同结构的节点，测量后立即移除；fixed 定位，测量时不撑大页面
 * @param value 文字
 * @returns width：一行的宽度（不含 padding）；fontSize：字号；lineHeight：行高；padding：内容区左右 padding
 */
export const measureText = (value: string) => {
	const wrapper = document.createElement('div');
	wrapper.className = 'vc-popover-wrapper';
	wrapper.style.cssText = 'position: fixed; top: 0; left: 0; visibility: hidden; pointer-events: none;';
	const container = document.createElement('div');
	container.className = 'vc-popover-wrapper__container';
	container.style.cssText = 'width: max-content; white-space: nowrap;';
	container.textContent = value;
	wrapper.appendChild(container);
	document.body.appendChild(wrapper);

	const [, right, , left] = getPadding(container);
	const style = getComputedStyle(container);
	const size = {
		width: container.getBoundingClientRect().width - left - right,
		fontSize: parseFloat(style.fontSize) || 0,
		lineHeight: parseFloat(style.lineHeight) || 0,
		padding: left + right
	};
	wrapper.remove();
	return size;
};
