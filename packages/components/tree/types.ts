import type { ComponentInternalInstance, Ref } from 'vue';
import type { Props } from './tree-props';
import type { TreeStore, TreeNode } from './store';

export interface TreeProvide {
	props: Props;
	store: TreeStore;
	root: TreeNode;
	currentNodeInstance: Ref<ComponentInternalInstance>;
	instance: ComponentInternalInstance;
	drag: any;
	emit: any;
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
	event: DragEvent;
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
