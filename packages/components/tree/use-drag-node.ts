import { reactive, getCurrentInstance } from 'vue';
import type { Ref } from 'vue';
import { addClass, removeClass } from '@deot/helper-dom';
import type { TreeStore, TreeNode } from './store';

export const useDragNode = (store: TreeStore, dropIndicator: Ref<HTMLElement | undefined>) => {
	const { props, emit, vnode } = getCurrentInstance()!;
	const state = reactive({
		showDropIndicator: false,
		draggingNode: null as any,
		dropNode: null as any,
		allowDrop: true,
		dropType: ''
	});

	const handleDragStart = (e: any, instance: any) => {
		if (typeof props.allowDrag === 'function' && !props.allowDrag(instance.props.node)) {
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
		emit('node-drag-start', instance.props.node, e);
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

		let dropPrev = true;
		let dropInner = true;
		let dropNext = true;
		let userAllowDropInner = true;
		if (typeof props.allowDrop === 'function') {
			dropPrev = props.allowDrop(draggingTreeNode, dropTreeNode, 'prev');
			userAllowDropInner = props.allowDrop(draggingTreeNode, dropTreeNode, 'inner');
			dropInner = userAllowDropInner;
			dropNext = props.allowDrop(draggingTreeNode, dropTreeNode, 'next');
		}
		e.dataTransfer.dropEffect = dropInner ? 'move' : 'none';
		if ((dropPrev || dropInner || dropNext) && oldDropNode !== dropNode) {
			if (oldDropNode) {
				emit('node-drag-leave', draggingTreeNode, oldDropNode.props.node, e);
			}
			emit('node-drag-enter', draggingTreeNode, dropTreeNode, e);
		}

		if (dropPrev || dropInner || dropNext) {
			state.dropNode = dropNode;
		}

		if (dropTreeNode.getNextSiblingNode() === draggingTreeNode) {
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

		const targetPosition = dropNode.vnode.el!.getBoundingClientRect();
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
		emit('node-drag-over', draggingTreeNode, dropTreeNode, e);
	};

	const handleDragEnd = (e) => {
		const { draggingNode, dropType, dropNode } = state;
		const draggingTreeNode = draggingNode!.props.node! as TreeNode;
		const dropTreeNode = dropNode!.props.node! as TreeNode;

		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';

		if (draggingNode && dropNode) {
			const draggingNodeCopy = { data: draggingTreeNode.states.data };
			if (dropType !== 'none') {
				draggingTreeNode.remove();
			}
			let newNode: any;
			if (dropType === 'before') {
				newNode = dropTreeNode.parentNode!.insertBefore(draggingNodeCopy, dropTreeNode);
			} else if (dropType === 'after') {
				newNode = dropTreeNode.parentNode!.insertAfter(draggingNodeCopy, dropTreeNode);
			} else if (dropType === 'inner') {
				newNode = dropTreeNode.insertChild(draggingNodeCopy);
			}
			if (newNode && dropType !== 'none') {
				store.registerNode(newNode as TreeNode);
			}

			removeClass(dropNode.vnode.el as any, 'is-drop-inner');

			emit('node-drag-end', draggingTreeNode, dropTreeNode, dropType, e);
			if (dropType !== 'none') {
				emit('node-drop', draggingTreeNode, dropTreeNode, dropType, e);
			}
		}
		if (draggingNode && !dropNode) {
			emit('node-drag-end', draggingTreeNode, null, dropType, e);
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
				'drag-start': handleDragStart,
				'drag-over': handleDragOver,
				'drag-end': handleDragEnd,
			};

			return methods[e] && methods[e](...rest);
		}
	};
};
