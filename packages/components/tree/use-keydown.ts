import { nextTick } from 'vue';
import { raf } from '@deot/helper-utils';
import type { TreeNode } from './store';
import { findEnabled } from '../select/hooks/use-navigate';

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

const isEnabled = (node: TreeNode) => !node.getter.disabled;

// 虚拟列表中滚入的行要等列表处理完滚动才渲染：聚焦时最多再等的帧数
const MAX_FRAMES = 6;

/**
 * 树的键盘：焦点在行上时，按铺平的可见节点移动（与 WAI-ARIA 的 tree 一致）
 * 	- ↑ ↓：上一个 / 下一个可用节点，首尾循环
 * 	- →：收起的节点展开；已展开时进入第一个子节点
 * 	- ←：展开的节点收起；已收起时回到父节点
 * 	- Enter / 空格：显示复选框时切换勾选
 * 	- 只有一个行可以 Tab 进入（roving tabindex）：初始为第一个勾选的可用节点，否则第一个可用节点；之后跟随焦点
 * @param options ~
 * @returns handleKeydown / handleFocusin：绑在树的根节点上；initTabStop：挂载后调用
 */
export const useKeydown = (options: KeydownOptions) => {
	const { getRows, getNode, getElement, scrollToIndex, toggle, toggleCheck, showCheckbox } = options;
	let tabStop: Element | null = null;

	const setTabStop = (el?: Element | null) => {
		if (el === tabStop) return;
		tabStop?.setAttribute('tabindex', '-1');
		el?.setAttribute('tabindex', '0');
		tabStop = el || null;
	};

	const focus = (node: TreeNode) => {
		const index = getRows().indexOf(node);
		index !== -1 && scrollToIndex(index);
		let frames = 0;
		const attempt = () => {
			const el = getElement(node) as HTMLElement | undefined;
			if (!el) {
				++frames <= MAX_FRAMES && raf(attempt);
				return;
			}
			setTabStop(el);
			el.focus({ preventScroll: true });
		};
		nextTick(attempt);
	};

	const handleKeydown = (e: KeyboardEvent) => {
		// 只处理行自身（复选框等内部元素有自己的按键）
		const node = getNode(e.target as Element);
		if (!node) return;
		const rows = getRows();
		const index = rows.indexOf(node);
		const { isLeaf, expanded } = node.states;
		switch (e.key) {
			case 'ArrowDown':
			case 'ArrowUp': {
				e.preventDefault();
				const step = e.key === 'ArrowDown' ? 1 : -1;
				const next = findEnabled(rows, index === -1 ? 0 : index + step, step, isEnabled);
				next !== -1 && focus(rows[next]);
				break;
			}
			case 'ArrowRight': {
				e.preventDefault();
				if (isLeaf) break;
				if (!expanded) {
					toggle(node);
				} else if (rows[index + 1]?.parentNode === node) {
					focus(rows[index + 1]);
				}
				break;
			}
			case 'ArrowLeft': {
				e.preventDefault();
				const parent = node.parentNode;
				if (!isLeaf && expanded) {
					toggle(node);
				} else if (parent && parent.states.level > 0) {
					focus(parent);
				}
				break;
			}
			case 'Enter':
			case ' ': {
				if (!showCheckbox() || !isEnabled(node)) break;
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
		const node = rows.find(item => isEnabled(item) && item.states.checked) || rows.find(isEnabled);
		setTabStop(node && getElement(node));
	};

	return { handleKeydown, handleFocusin, initTabStop };
};
