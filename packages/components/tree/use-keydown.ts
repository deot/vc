import type { TreeNode } from './store';
import { findEnabled, findPreferred } from '../select/hooks/use-navigate';

interface KeydownOptions {
	// 铺平的可见节点
	getRows: () => TreeNode[];
	// 行节点（元素）对应的树节点；不是行时为 undefined
	getNode: (el: Element) => TreeNode | undefined;
	// 树节点所在的行；未渲染时为 undefined
	getElement: (node: TreeNode) => Element | undefined;
	// 把第 index 行滚动到可视范围
	scrollToIndex: (index: number) => void;
	toggle: (node: TreeNode) => void;
	toggleCheck: (node: TreeNode) => void;
	showCheckbox: () => boolean;
}

// 可以高亮、聚焦、勾选的节点（Tree 的键盘与 TreeSelect 的高亮共用）
export const isNodeEnabled = (node: TreeNode) => !node.getter.disabled;

export type TreeShift = { toggle: TreeNode } | { index: number };

/**
 * ← → 的去向（与 WAI-ARIA 的 tree 一致；Tree 的焦点与 TreeSelect 的高亮共用）：
 * 	- →：收起的节点展开；已展开时进入第一个子节点
 * 	- ←：展开的节点收起；已收起时回到父节点
 * @param rows 铺平的可见节点
 * @param node 当前节点
 * @param step 1 为 →，-1 为 ←
 * @returns 要切换展开的节点，或要移到的行；不处理时为 undefined
 */
export const resolveShift = (rows: TreeNode[], node: TreeNode, step: number): TreeShift | undefined => {
	const { isLeaf, expanded } = node.states;
	if (step > 0) {
		if (isLeaf) return;
		if (!expanded) return { toggle: node };
		const index = rows.indexOf(node);
		return index !== -1 && rows[index + 1]?.parentNode === node ? { index: index + 1 } : void 0;
	}
	if (!isLeaf && expanded) return { toggle: node };
	const parent = node.parentNode;
	return parent && parent.states.level > 0 ? { index: rows.indexOf(parent) } : void 0;
};

/**
 * 树的键盘：焦点在行上时，按铺平的可见节点移动（与 WAI-ARIA 的 tree 一致）
 * 	- ↑ ↓：上一个 / 下一个可用节点，首尾循环
 * 	- ← →：见 resolveShift
 * 	- Enter / 空格：显示复选框时切换勾选
 * 	- 只有一个行可以 Tab 进入（roving tabindex）：初始为第一个勾选的可用节点，否则第一个可用节点；之后跟随焦点
 * 	- 目标行尚未渲染（虚拟列表中滚入的行）时记下它，行挂载登记时（handleRowMounted）再聚焦
 * @param options ~
 * @returns handleKeydown / handleFocusin：绑在树的根节点上；initTabStop：挂载后调用；handleRowMounted：行挂载登记时调用
 */
export const useKeydown = (options: KeydownOptions) => {
	const { getRows, getNode, getElement, scrollToIndex, toggle, toggleCheck, showCheckbox } = options;
	let tabStop: Element | null = null;
	// 等待行渲染后聚焦的节点
	let pending: TreeNode | null = null;

	const setTabStop = (el?: Element | null) => {
		if (el === tabStop) return;
		tabStop?.setAttribute('tabindex', '-1');
		el?.setAttribute('tabindex', '0');
		tabStop = el || null;
	};

	const focusEl = (el: Element) => {
		setTabStop(el);
		(el as HTMLElement).focus({ preventScroll: true });
	};

	const focus = (node: TreeNode) => {
		const index = getRows().indexOf(node);
		index !== -1 && scrollToIndex(index);
		const el = getElement(node);
		pending = el ? null : node;
		el && focusEl(el);
	};

	/**
	 * 行挂载登记：等待中的节点的行出现时聚焦；焦点已离开这棵树时不再抢回
	 * @param node 行的节点
	 * @param el 行的元素
	 */
	const handleRowMounted = (node: TreeNode, el: Element) => {
		if (pending !== node) return;
		pending = null;
		el.closest('[role="tree"]')?.contains(document.activeElement) && focusEl(el);
	};

	const handleKeydown = (e: KeyboardEvent) => {
		// 只处理行自身（复选框等内部元素有自己的按键）
		const node = getNode(e.target as Element);
		if (!node) return;
		pending = null;
		const rows = getRows();
		switch (e.key) {
			case 'ArrowDown':
			case 'ArrowUp': {
				e.preventDefault();
				const step = e.key === 'ArrowDown' ? 1 : -1;
				const index = rows.indexOf(node);
				const next = findEnabled(rows, index === -1 ? 0 : index + step, step, isNodeEnabled);
				next !== -1 && focus(rows[next]);
				break;
			}
			case 'ArrowRight':
			case 'ArrowLeft': {
				e.preventDefault();
				const shift = resolveShift(rows, node, e.key === 'ArrowRight' ? 1 : -1);
				if (!shift) break;
				'toggle' in shift ? toggle(shift.toggle) : focus(rows[shift.index]);
				break;
			}
			case 'Enter':
			case ' ': {
				if (!showCheckbox() || !isNodeEnabled(node)) break;
				e.preventDefault();
				toggleCheck(node);
				break;
			}
			default:
				break;
		}
	};

	// 点击等方式聚焦到行：Tab 停留点跟随
	const handleFocusin = (e: FocusEvent) => {
		const el = e.target as Element;
		getNode(el) && setTabStop(el);
	};

	const initTabStop = () => {
		const rows = getRows();
		const index = findPreferred(rows, isNodeEnabled, node => node.states.checked);
		setTabStop(index !== -1 ? getElement(rows[index]) : null);
	};

	return { handleKeydown, handleFocusin, initTabStop, handleRowMounted };
};
