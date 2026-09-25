import { composedPath } from '@deot/helper-dom';

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
