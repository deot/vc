import { reactive, getCurrentInstance, toRaw } from 'vue';
import type { Ref } from 'vue';
import { addClass, removeClass } from '@deot/helper-dom';
import type { TreeStore, TreeNode } from './store';
import type {
	TreeAllowDropPayload,
	TreeDropPlace,
	TreeDropPosition,
	TreeMove,
	TreeNodeDragEndPayload,
	TreeNodeDragOverPayload,
	TreeNodeDragPayload,
	TreeNodeDropPayload
} from './types';

// 节点在父节点子节点中的下标
const indexIn = (parent: TreeNode, node: TreeNode) => {
	const target = toRaw(node);
	return toRaw(parent.childNodes).findIndex(item => toRaw(item) === target);
};

// 对外的父节点：根级为 null（不暴露内部的根节点）
const toParent = (parent: TreeNode) => (parent.parentNode ? parent : null);

/**
 * 节点当前的位置
 * @param node 节点
 * @returns 父节点与下标
 */
const getPlace = (node: TreeNode): TreeDropPlace => {
	const parent = node.parentNode!;
	return { parent: toParent(parent), index: indexIn(parent, node) };
};

/**
 * 放到目标节点某个区域后的位置，与放下时的插入方式一致：
 * before / after 插入到目标节点的父节点中，inner 追加到目标节点的子节点末尾；
 * to.index 为移除被拖节点之后的下标
 * @param node 被拖节点
 * @param target 目标节点
 * @param position 区域
 * @returns 移动前后的位置
 */
const getMove = (node: TreeNode, target: TreeNode, position: TreeDropPosition): TreeMove => {
	const parent = position === 'inner' ? target : target.parentNode!;
	let index = position === 'inner'
		? target.childNodes.length
		: indexIn(parent, target) + (position === 'after' ? 1 : 0);
	// 同一父节点内，被拖节点在插入位置之前：移除后插入位置前移一位
	if (toRaw(node.parentNode) === toRaw(parent) && indexIn(parent, node) < index) index--;
	return { from: getPlace(node), to: { parent: toParent(parent), index } };
};

export const useDragNode = (store: TreeStore, dropIndicator: Ref<HTMLElement | undefined>) => {
	const { props, emit, vnode } = getCurrentInstance()!;
	const state = reactive({
		showDropIndicator: false,
		draggingNode: null as any,
		dropNode: null as any,
		allowDrop: true,
		dropType: ''
	});

	// 询问能否放到目标节点的某个区域
	const canDrop = (node: TreeNode, target: TreeNode, position: TreeDropPosition) => {
		if (typeof props.allowDrop !== 'function') return true;
		return !!props.allowDrop({
			node,
			data: node.states.data,
			targetNode: target,
			position,
			...getMove(node, target, position)
		} satisfies TreeAllowDropPayload);
	};

	const handleDragStart = (e: any, instance: any) => {
		const node = instance.props.node as TreeNode;
		if (typeof props.allowDrag === 'function' && !props.allowDrag({ node, data: node.states.data })) {
			e.preventDefault();
			return false;
		}
		e.dataTransfer.effectAllowed = 'move';

		// wrap in try catch to address IE's error when first param is 'text/plain'
		try {
			// setData is required for draggable to work in FireFox
			// the content has to be '' so dragging a node out of the tree won't open a new tab in FireFox
			e.dataTransfer.setData('text/plain', '');
		} catch (error) {
			console.log(error);
		}
		state.draggingNode = instance;
		emit('node-dragstart', { node, data: node.states.data, event: e } satisfies TreeNodeDragPayload);
	};

	const handleDragOver = (e: any, instance: any) => {
		const dropNode = instance;
		const oldDropNode = state.dropNode!;

		if (oldDropNode && oldDropNode !== dropNode) {
			removeClass(oldDropNode.vnode.el as any, 'is-drop-inner');
		}
		const draggingNode = state.draggingNode!;

		const draggingTreeNode = draggingNode.props.node as TreeNode;
		const dropTreeNode = dropNode.props.node as TreeNode;

		if (!draggingTreeNode || !dropTreeNode) return;

		const payload = (targetNode: TreeNode): TreeNodeDragOverPayload => ({
			node: draggingTreeNode,
			data: draggingTreeNode.states.data,
			targetNode,
			event: e
		});

		let dropPrev = canDrop(draggingTreeNode, dropTreeNode, 'before');
		const userAllowDropInner = canDrop(draggingTreeNode, dropTreeNode, 'inner');
		let dropInner = userAllowDropInner;
		let dropNext = canDrop(draggingTreeNode, dropTreeNode, 'after');
		e.dataTransfer.dropEffect = dropInner ? 'move' : 'none';
		if ((dropPrev || dropInner || dropNext) && oldDropNode !== dropNode) {
			if (oldDropNode) {
				emit('node-dragleave', payload(oldDropNode.props.node));
			}
			emit('node-dragenter', payload(dropTreeNode));
		}

		if (dropPrev || dropInner || dropNext) {
			state.dropNode = dropNode;
		}

		if (dropTreeNode.getNextSiblingNode() === draggingTreeNode) {
			dropNext = false;
		}
		// 展开且有子节点：它的下方紧接第一个子节点，插入线会画在两者之间，而 after 会放到整棵子树之后
		if (dropTreeNode.states.expanded && dropTreeNode.childNodes.length) {
			dropNext = false;
		}
		if (dropTreeNode.getPreviousSiblingNode() === draggingTreeNode) {
			dropPrev = false;
		}
		if (dropTreeNode.contains(draggingTreeNode, false)) {
			dropInner = false;
		}
		if (draggingTreeNode === dropTreeNode || draggingTreeNode.contains(dropTreeNode)) {
			dropPrev = false;
			dropInner = false;
			dropNext = false;
		}

		// 按节点自己的内容行划分区域：节点元素包含展开的子节点
		const targetPosition = dropNode.vnode.el!.querySelector('.vc-tree-node__content').getBoundingClientRect();
		const treePosition = vnode.el!.getBoundingClientRect();

		let dropType: string;
		const prevPercent = dropPrev ? (dropInner ? 0.25 : (dropNext ? 0.45 : 1)) : -1;
		const nextPercent = dropNext ? (dropInner ? 0.75 : (dropPrev ? 0.55 : 0)) : 1;

		let indicatorTop = -9999;
		const distance = e.clientY - targetPosition.top;
		if (distance < targetPosition.height * prevPercent) {
			dropType = 'before';
		} else if (distance > targetPosition.height * nextPercent) {
			dropType = 'after';
		} else if (dropInner) {
			dropType = 'inner';
		} else {
			dropType = 'none';
		}

		const iconPosition = dropNode.vnode.el!.querySelector('.vc-tree-node__expand-icon').getBoundingClientRect();
		if (dropType === 'before') {
			indicatorTop = iconPosition.top - treePosition.top;
		} else if (dropType === 'after') {
			indicatorTop = iconPosition.bottom - treePosition.top;
		}
		dropIndicator.value!.style.top = indicatorTop + 'px';
		dropIndicator.value!.style.left = (iconPosition.right - treePosition.left) + 'px';

		if (dropType === 'inner') {
			addClass(dropNode.vnode.el as any, 'is-drop-inner');
		} else {
			removeClass(dropNode.vnode.el as any, 'is-drop-inner');
		}

		state.showDropIndicator = dropType === 'before' || dropType === 'after';

		state.allowDrop = state.showDropIndicator || userAllowDropInner;
		state.dropType = dropType;
		emit('node-dragover', payload(dropTreeNode));
	};

	const handleDragEnd = (e) => {
		const { draggingNode, dropType, dropNode } = state;

		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';

		if (draggingNode) {
			const draggingTreeNode = draggingNode.props.node as TreeNode;
			// 没有落点：allowDrop 拒绝了经过的所有节点
			const dropTreeNode = (dropNode?.props.node || null) as TreeNode | null;
			const position = dropTreeNode && dropType !== 'none' ? dropType as TreeDropPosition : null;
			// 移动前计算位置
			const move = dropTreeNode && position ? getMove(draggingTreeNode, dropTreeNode, position) : null;

			if (dropTreeNode && position) {
				const draggingNodeCopy = { data: draggingTreeNode.states.data };
				draggingTreeNode.remove();
				let newNode: any;
				if (position === 'before') {
					newNode = dropTreeNode.parentNode!.insertBefore(draggingNodeCopy, dropTreeNode);
				} else if (position === 'after') {
					newNode = dropTreeNode.parentNode!.insertAfter(draggingNodeCopy, dropTreeNode);
				} else {
					newNode = dropTreeNode.insertChild(draggingNodeCopy);
				}
				if (newNode) {
					store.registerNode(newNode as TreeNode);
				}
			}
			dropNode && removeClass(dropNode.vnode.el as any, 'is-drop-inner');

			// 与浏览器一致：先 node-drop，再 node-dragend
			const base = { node: draggingTreeNode, data: draggingTreeNode.states.data, event: e };
			if (move) {
				emit('node-drop', {
					...base,
					targetNode: dropTreeNode!,
					position: position!,
					...move
				} satisfies TreeNodeDropPayload);
			}
			emit('node-dragend', {
				...base,
				targetNode: dropTreeNode,
				position,
				dropped: !!move
			} satisfies TreeNodeDragEndPayload);
		}

		state.showDropIndicator = false;
		state.draggingNode = null;
		state.dropNode = null;
		state.allowDrop = true;
	};

	return {
		state,
		emit: (e: any, ...rest: any[]) => {
			const methods = {
				dragstart: handleDragStart,
				dragover: handleDragOver,
				dragend: handleDragEnd
			};

			return methods[e] && methods[e](...rest);
		}
	};
};
