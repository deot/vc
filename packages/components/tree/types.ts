import type { ComponentInternalInstance, VNode } from 'vue';
import type { Props } from './tree-props';
import type { TreeStore, TreeNode } from './store';

export interface TreeProvide {
	props: Props;
	store: TreeStore;
	root: TreeNode;
	instance: ComponentInternalInstance;
	emit: any;
	// 正在展开 / 收起动画的节点
	motions: Map<TreeNode, 'expand' | 'collapse'>;
	// 用户发起的展开 / 收起（带动画、accordion、node-expand-change）
	toggle: (node: TreeNode, instance: ComponentInternalInstance) => Promise<void>;
	// 按当前勾选同步 v-model，返回勾选数据
	sync: () => Pick<TreeCheckPayload, 'checkedNodes' | 'checkedValues' | 'halfCheckedNodes' | 'halfCheckedValues'>;
	// 切换勾选：联动后发出 check 并同步 v-model
	toggleCheck: (node: TreeNode, checked?: boolean) => Promise<void>;
	// 渲染一行（铺平的列表与动画块共用）
	renderNode: (node: TreeNode) => VNode;
	// 行挂载 / 卸载时登记，供按节点找行
	registerRow: (node: TreeNode, row: ComponentInternalInstance) => void;
	unregisterRow: (node: TreeNode, row: ComponentInternalInstance) => void;
};

/**
 * 拖拽落点：相对目标节点之前 / 之后，或成为它的子节点
 */
export type TreeDropPosition = 'before' | 'after' | 'inner';

/**
 * 节点在父节点子节点中的位置：parent 为 null 表示根级
 */
export type TreeDropPlace = {
	parent: TreeNode | null;
	index: number;
};

/**
 * 移动前后的位置：to.index 为移除被拖节点之后的下标
 */
export type TreeMove = {
	from: TreeDropPlace;
	to: TreeDropPlace;
};

/**
 * 节点与它的数据（node.states.data）
 */
export interface TreeNodePayload {
	node: TreeNode;
	data: any;
}

/**
 * node-click / node-contextmenu 的参数
 */
export interface TreeNodeEventPayload extends TreeNodePayload {
	// 节点组件实例
	instance: ComponentInternalInstance;
	event: Event;
}

/**
 * node-expand-change 的参数
 */
export interface TreeNodeExpandChangePayload extends TreeNodePayload {
	expanded: boolean;
	instance: ComponentInternalInstance;
}

/**
 * check-change 的参数
 */
export interface TreeCheckChangePayload extends TreeNodePayload {
	checked: boolean;
	indeterminate: boolean;
}

/**
 * check 的参数：勾选后树的选中状态
 */
export interface TreeCheckPayload extends TreeNodePayload {
	// 勾选后该节点是否选中
	checked: boolean;
	checkedNodes: any[];
	checkedValues: any[];
	halfCheckedNodes: any[];
	halfCheckedValues: any[];
}

/**
 * current-change 的参数
 */
export interface TreeCurrentChangePayload extends TreeNodePayload {
	oldNode: TreeNode | null;
}

/**
 * allowDrag 的参数
 */
export type TreeAllowDragPayload = TreeNodePayload;

/**
 * allowDrop 的参数：被拖节点放到目标节点的某个区域
 */
export interface TreeAllowDropPayload extends TreeNodePayload, TreeMove {
	targetNode: TreeNode;
	position: TreeDropPosition;
}

/**
 * node-dragstart 的参数
 */
export interface TreeNodeDragPayload extends TreeNodePayload {
	// 最近一次的指针事件（鼠标或触摸）
	event: MouseEvent | TouchEvent;
}

/**
 * node-dragenter / node-dragover / node-dragleave 的参数：targetNode 为进入、经过或离开的节点
 */
export interface TreeNodeDragOverPayload extends TreeNodeDragPayload {
	targetNode: TreeNode;
}

/**
 * node-dragend 的参数：没有落点时 targetNode / position 为 null
 */
export interface TreeNodeDragEndPayload extends TreeNodeDragPayload {
	targetNode: TreeNode | null;
	position: TreeDropPosition | null;
	// 是否放下（移动了节点）
	dropped: boolean;
}

/**
 * node-drop 的参数
 */
export interface TreeNodeDropPayload extends TreeNodeDragPayload, TreeMove {
	targetNode: TreeNode;
	position: TreeDropPosition;
}
