import { ref, getCurrentInstance } from 'vue';
import type { Ref } from 'vue';
import { addClass, removeClass } from '@deot/helper-dom';
import type { TreeStore } from './model/tree-store';

export default (store: TreeStore, dropIndicator: Ref<HTMLElement | undefined>) => {
	const { props, emit, vnode } = getCurrentInstance()!;
	const state = ref({
		showDropIndicator: false,
		draggingNode: null as any,
		dropNode: null as any,
		allowDrop: true,
		dropType: ''
	});

	const handleDragStart = (e: any, treeNode: any) => {
		if (typeof props.allowDrag === 'function' && !props.allowDrag(treeNode.props.node)) {
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
		state.value.draggingNode = treeNode;
		emit('node-drag-start', treeNode.props.node, e);
	};

	const handleDragOver = (e: any, treeNode: any) => {
		const dropNode = treeNode;
		const oldDropNode = state.value.dropNode as any;

		if (oldDropNode && oldDropNode !== dropNode) {
			removeClass(oldDropNode.vnode.el, 'is-drop-inner');
		}
		const draggingNode = state.value.draggingNode as any;

		const { node: $draggingNode } = draggingNode.props;
		const { node: $dropNode } = dropNode.props;

		if (!$draggingNode || !$dropNode) return;

		let dropPrev = true;
		let dropInner = true;
		let dropNext = true;
		let userAllowDropInner = true;
		if (typeof props.allowDrop === 'function') {
			dropPrev = props.allowDrop($draggingNode, $dropNode, 'prev');
			userAllowDropInner = props.allowDrop($draggingNode, $dropNode, 'inner');
			dropInner = userAllowDropInner;
			dropNext = props.allowDrop($draggingNode, $dropNode, 'next');
		}
		e.dataTransfer.dropEffect = dropInner ? 'move' : 'none';
		if ((dropPrev || dropInner || dropNext) && oldDropNode !== dropNode) {
			if (oldDropNode) {
				emit('node-drag-leave', $draggingNode, oldDropNode.props.node, e);
			}
			emit('node-drag-enter', $draggingNode, $dropNode, e);
		}

		if (dropPrev || dropInner || dropNext) {
			state.value.dropNode = dropNode;
		}

		if ($dropNode.nextSibling === $draggingNode) {
			dropNext = false;
		}
		if ($dropNode.previousSibling === $draggingNode) {
			dropPrev = false;
		}
		if ($dropNode.contains($draggingNode, false)) {
			dropInner = false;
		}
		if ($draggingNode === $dropNode || $draggingNode.contains($dropNode)) {
			dropPrev = false;
			dropInner = false;
			dropNext = false;
		}

		const targetPosition = dropNode.vnode.el.getBoundingClientRect();
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

		const iconPosition = dropNode.vnode.el.querySelector('.vc-tree-node__expand-icon').getBoundingClientRect();
		if (dropType === 'before') {
			indicatorTop = iconPosition.top - treePosition.top;
		} else if (dropType === 'after') {
			indicatorTop = iconPosition.bottom - treePosition.top;
		}
		dropIndicator.value!.style.top = indicatorTop + 'px';
		dropIndicator.value!.style.left = (iconPosition.right - treePosition.left) + 'px';

		if (dropType === 'inner') {
			addClass(dropNode.vnode.el, 'is-drop-inner');
		} else {
			removeClass(dropNode.vnode.el, 'is-drop-inner');
		}

		state.value.showDropIndicator = dropType === 'before' || dropType === 'after';

		state.value.allowDrop = state.value.showDropIndicator || userAllowDropInner;
		state.value.dropType = dropType;
		emit('node-drag-over', $draggingNode, $dropNode, e);
	};

	const handleDragEnd = (e) => {
		const { draggingNode, dropType, dropNode } = state.value;
		const { node: $draggingNode } = draggingNode.props;
		const { node: $dropNode } = dropNode.props;

		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';

		if (draggingNode && dropNode) {
			const draggingNodeCopy = { data: $draggingNode.data };
			if (dropType !== 'none') {
				$draggingNode.remove();
			}
			if (dropType === 'before') {
				$dropNode.parent.insertBefore(draggingNodeCopy, $dropNode);
			} else if (dropType === 'after') {
				$dropNode.parent.insertAfter(draggingNodeCopy, $dropNode);
			} else if (dropType === 'inner') {
				$dropNode.insertChild(draggingNodeCopy);
			}
			if (dropType !== 'none') {
				store.registerNode(draggingNodeCopy);
			}

			removeClass(dropNode.vnode.el, 'is-drop-inner');

			emit('node-drag-end', $draggingNode, $dropNode, dropType, e);
			if (dropType !== 'none') {
				emit('node-drop', $draggingNode, $dropNode, dropType, e);
			}
		}
		if (draggingNode && !dropNode) {
			emit('node-drag-end', $draggingNode, null, dropType, e);
		}

		state.value.showDropIndicator = false;
		state.value.draggingNode = null;
		state.value.dropNode = null;
		state.value.allowDrop = true;
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
