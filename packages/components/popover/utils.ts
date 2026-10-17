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
 * 路径（由内到外）在 area 内对应的节点
 * 	- 路径含 area 时为路径的起点
 * 	- 落在已登记的弹层内时，改用该弹层的触发节点继续判断（可多层），对应节点为最后找到的触发节点
 * @param path 路径
 * @param area 区域节点
 * @returns 对应的节点，不在 area 内时为 null
 */
const resolveInArea = (path: Node[], area: Element) => {
	const seen = new Set<Node>();
	let node: Node | undefined = path[0];
	while (!path.includes(area)) {
		const popup = path.find(item => triggers.has(item) && !seen.has(item));
		if (!popup) return null;
		seen.add(popup);
		node = triggers.get(popup);
		path = getAncestors(node);
	}
	return node || null;
};

/**
 * 事件是否发生在 area 内（含嵌套的子弹层）
 * 	- 落在已登记的弹层内时，改用该弹层的触发节点继续判断（可多层）
 * 	- 如：Select 下拉打开时，点击标签列表弹层（挂 body，触发节点在 Select 内）视为点在 Select 内
 * @param e 事件（按事件路径判断，目标节点可能随后被移除）
 * @param area 区域节点
 * @returns ~
 */
export const isInArea = (e: Event, area: Element) => !!resolveInArea(composedPath(e) as Node[], area);

/**
 * 节点在 area 内对应的节点：本身在 area 内时为自身；在 area 内打开的弹层（可多层）中时为 area 内的触发节点
 * @param node 节点
 * @param area 区域节点
 * @returns 对应的节点，不在 area 内时为 null
 */
export const getAreaNode = (node: Node | null | undefined, area: Element) => resolveInArea(getAncestors(node), area);

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
	const content = document.createElement('div');
	content.className = 'vc-popover-wrapper__content';
	content.style.cssText = 'width: max-content; white-space: nowrap;';
	content.textContent = value;
	container.appendChild(content);
	wrapper.appendChild(container);
	document.body.appendChild(wrapper);

	const [, right, , left] = getPadding(content);
	const style = getComputedStyle(content);
	const size = {
		width: content.getBoundingClientRect().width - left - right,
		fontSize: parseFloat(style.fontSize) || 0,
		lineHeight: parseFloat(style.lineHeight) || 0,
		padding: left + right
	};
	wrapper.remove();
	return size;
};

// 文字输入框：按下鼠标时获得焦点并放置光标（含只读的）
const isTextField = (el: HTMLInputElement) => {
	return el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && !/^(checkbox|radio)$/.test(el.type)) || !!el.isContentEditable;
};

/**
 * 能否在节点上输入文字（只读的输入框不能）
 * @param el ~
 * @returns ~
 */
export const isEditable = (el: EventTarget | null) => {
	return !!el && isTextField(el as HTMLInputElement) && !(el as HTMLInputElement).readOnly;
};

/**
 * 在弹层内容、触发器的非输入区域按下鼠标时不转移焦点（焦点留在触发器的输入框）；文字输入框照常获得焦点，复选框等仍可点击
 * @param e ~
 */
export const keepFocus = (e: MouseEvent) => {
	!isTextField(e.target as HTMLInputElement) && e.preventDefault();
};

/**
 * 浮层边界上隔离的上下文：浮层内容继承外层的 provide（路由、状态、配置等），但不属于外层的表单、组与布局
 * 	- 如 FormItem 内 Select 下拉里的输入框不参与该项的校验，CheckboxGroup 内浮层里的复选框不加入该组，
 * 	  ButtonGroup 的尺寸不作用于浮层里的按钮，Tree 节点内浮层里的树不受外层手风琴影响，Affix 内浮层里的 Tabs 不按外层吸顶偏移
 * 	- 值与各消费方 inject 的默认值一致；每个浮层一份，消费方改写时互不影响
 * @returns key 与值
 */
export const getIsolatedContexts = () => ({
	'vc-form': undefined,
	'vc-form-item': {},
	'vc-checkbox-group': {},
	'vc-radio-group': {},
	'vc-button-group': { size: '', vertical: false, circle: false },
	'vc-tree-node-map': null,
	'vc-affix': null
});
