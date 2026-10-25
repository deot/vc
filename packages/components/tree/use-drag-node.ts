import { shallowReactive, toRaw } from 'vue';
import type { Ref } from 'vue';
import type { Nullable } from '@deot/helper-shared';
import {
	INTERACTIVE_SELECTOR,
	createGhost,
	createIndicator,
	getEdgeDelta,
	getOuterViewport,
	resolveOuterCarrier,
	scrollOuter,
	toRootOffset,
	useDragDrop
} from '../drag';
import type { DragDropState } from '../drag';
import type { ExternalCarrier } from '../recycle-list/viewport/external/carrier';
import type { TreeStore, TreeNode } from './store';
import type { Props } from './tree-props';
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

type DragOptions = {
	props: Props;
	store: TreeStore;
	emit: (event: any, ...args: any[]) => void;
	// 树的根节点（position: relative）
	root: Ref<Nullable<HTMLElement>>;
	// 行（元素）对应的节点 / 节点所在的行
	getNode: (el: Element) => TreeNode | undefined;
	getElement: (node: TreeNode) => Element | undefined;
};

// 激活后的拖拽会话
type DragSession = {
	ghost: HTMLElement;
	indicator: HTMLElement;
	// 按下点到被拖行顶部的距离：跟随元素保持这段距离
	grabY: number;
	outer: ExternalCarrier;
	// 当前落点所在的行（inner 时加 is-drop-inner）
	dropEl: Element | null;
};

type DragState = DragDropState<TreeNode, DragSession>;

/**
 * 节点拖拽（指针事件，见 useDragDrop；不用原生拖拽，虚拟化时被拖行滚出视口被回收也不影响）：
 * 	- 从节点任意位置按下（输入框、复选框、展开图标等交互元素与带 vc-drag-ignore 的元素除外），越过阈值后开始；触摸需长按
 * 	- 跟随元素（被拖行内容的克隆）随指针纵向移动；指针所在的节点按内容行划分 before / inner / after，before / after 画插入线，inner 高亮目标
 * 	- 指针靠近树所在滚动容器的上下边缘时自动滚动；Esc、失焦取消
 * 	- 松手：有落点时移动节点，先发出 node-drop，再发出 node-dragend；各事件的 event 为最近一次的指针事件
 * @param options ~
 * @returns state：拖拽状态（根节点的类名用）；handleMousedown / handleTouchstart：绑在根节点上
 */
export const useDragNode = (options: DragOptions) => {
	const { props, store, emit, root, getNode, getElement } = options;
	const state = shallowReactive({
		draggingNode: null as TreeNode | null,
		dropNode: null as TreeNode | null,
		dropType: '' as TreeDropPosition | 'none' | '',
		allowDrop: true
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

	const resolve = (target: HTMLElement) => {
		const el = root.value;
		if (!props.draggable || !el || !target?.closest) return null;
		const row = target.closest('[role="treeitem"]');
		if (!row || !el.contains(row)) return null;
		const interactive = target.closest(INTERACTIVE_SELECTOR);
		if (interactive && row.contains(interactive)) return null;
		const node = getNode(row);
		if (!node) return null;
		if (typeof props.allowDrag === 'function' && !props.allowDrag({ node, data: node.states.data })) return null;
		return { source: node, byHandle: false };
	};

	const activate = (current: DragState): Nullable<DragSession> => {
		const el = root.value;
		const row = getElement(current.source);
		const content = row?.querySelector<HTMLElement>(':scope > .vc-tree-node__content');
		if (!el || !content) return null;
		const offset = toRootOffset(el);
		const rect = content.getBoundingClientRect();
		const { ghost } = createGhost(el, content, 'vc-tree-node', 'vc-tree__drag-ghost');
		ghost.style.left = `${rect.left - offset.left}px`;
		ghost.style.width = `${rect.width}px`;
		return {
			ghost,
			indicator: createIndicator(el, 'vc-tree__drop-indicator'),
			grabY: current.startY - rect.top,
			outer: resolveOuterCarrier(el),
			dropEl: null
		};
	};

	const start = (current: DragState) => {
		const node = current.source;
		state.draggingNode = node;
		emit('node-dragstart', { node, data: node.states.data, event: current.event as any } satisfies TreeNodeDragPayload);
	};

	/**
	 * 指针所在的节点：计算落点区域，更新插入线与 inner 高亮，发出 dragenter / dragleave / dragover
	 * @param current 拖拽状态
	 * @param session 拖拽会话
	 */
	const hover = (current: DragState, session: DragSession) => {
		const el = root.value!;
		const hit = document.elementFromPoint(current.clientX, current.clientY);
		const row = hit?.closest?.('[role="treeitem"]');
		const dropNode = row && el.contains(row) ? getNode(row) : void 0;
		// 不在节点上：保持上一个落点
		if (!row || !dropNode) return;

		const node = current.source;
		const oldDropNode = state.dropNode;
		const payload = (targetNode: TreeNode): TreeNodeDragOverPayload => ({
			node,
			data: node.states.data,
			targetNode,
			event: current.event as any
		});

		let dropPrev = canDrop(node, dropNode, 'before');
		const userAllowDropInner = canDrop(node, dropNode, 'inner');
		let dropInner = userAllowDropInner;
		let dropNext = canDrop(node, dropNode, 'after');
		if ((dropPrev || dropInner || dropNext) && oldDropNode !== dropNode) {
			oldDropNode && emit('node-dragleave', payload(oldDropNode));
			emit('node-dragenter', payload(dropNode));
		}
		if (dropPrev || dropInner || dropNext) {
			state.dropNode = dropNode;
		}

		if (dropNode.getNextSiblingNode() === node) {
			dropNext = false;
		}
		// 展开且有子节点：它的下方紧接第一个子节点，插入线会画在两者之间，而 after 会放到整棵子树之后
		if (dropNode.states.expanded && dropNode.childNodes.length) {
			dropNext = false;
		}
		if (dropNode.getPreviousSiblingNode() === node) {
			dropPrev = false;
		}
		if (dropNode.contains(node, false)) {
			dropInner = false;
		}
		if (node === dropNode || node.contains(dropNode)) {
			dropPrev = false;
			dropInner = false;
			dropNext = false;
		}

		// 按节点自己的内容行划分区域
		const content = row.querySelector(':scope > .vc-tree-node__content')!;
		const target = content.getBoundingClientRect();
		const prevPercent = dropPrev ? (dropInner ? 0.25 : (dropNext ? 0.45 : 1)) : -1;
		const nextPercent = dropNext ? (dropInner ? 0.75 : (dropPrev ? 0.55 : 0)) : 1;
		const distance = current.clientY - target.top;
		let dropType: TreeDropPosition | 'none';
		if (distance < target.height * prevPercent) {
			dropType = 'before';
		} else if (distance > target.height * nextPercent) {
			dropType = 'after';
		} else if (dropInner) {
			dropType = 'inner';
		} else {
			dropType = 'none';
		}

		// 插入线：展开图标之后，落点之前 / 之后
		const offset = toRootOffset(el);
		const icon = content.querySelector('.vc-tree-node__expand-icon')!.getBoundingClientRect();
		const showIndicator = dropType === 'before' || dropType === 'after';
		session.indicator.style.display = showIndicator ? '' : 'none';
		session.indicator.style.top = `${(dropType === 'before' ? icon.top : icon.bottom) - offset.top}px`;
		session.indicator.style.left = `${icon.right - offset.left}px`;

		// inner 时高亮目标行（命令式：拖动过程不触发行的渲染）
		const innerEl = dropType === 'inner' ? row : null;
		if (session.dropEl !== innerEl) {
			session.dropEl?.classList.remove('is-drop-inner');
			innerEl?.classList.add('is-drop-inner');
			session.dropEl = innerEl;
		}

		state.allowDrop = showIndicator || userAllowDropInner;
		state.dropType = dropType;
		emit('node-dragover', payload(dropNode));
	};

	const update = (current: DragState, session: DragSession) => {
		const el = root.value;
		if (!el) return;
		const offset = toRootOffset(el);
		session.ghost.style.top = `${current.clientY - session.grabY - offset.top}px`;

		// 指针靠近树的可见范围上下边缘、且树在该方向被滚动容器遮住时，滚动容器
		const rect = el.getBoundingClientRect();
		const viewport = getOuterViewport(session.outer);
		const delta = getEdgeDelta(current.clientY, Math.max(rect.top, viewport.top), Math.min(rect.bottom, viewport.bottom));
		const clipped = delta < 0 ? rect.top < viewport.top - 0.5 : rect.bottom > viewport.bottom + 0.5;
		const scrolled = !!delta && clipped && scrollOuter(session.outer, delta);

		hover(current, session);
		return scrolled;
	};

	const finish = (current: DragState, session: DragSession, commit: boolean) => {
		session.ghost.remove();
		session.indicator.remove();
		session.dropEl?.classList.remove('is-drop-inner');

		const node = current.source;
		const dropNode = state.dropNode;
		const position = commit && dropNode && state.dropType && state.dropType !== 'none'
			? state.dropType
			: null;
		// 移动前计算位置
		const move = dropNode && position ? getMove(node, dropNode, position) : null;

		if (dropNode && position) {
			const copy = { data: node.states.data };
			node.remove();
			const newNode = position === 'before'
				? dropNode.parentNode!.insertBefore(copy, dropNode)
				: position === 'after'
					? dropNode.parentNode!.insertAfter(copy, dropNode)
					: dropNode.insertChild(copy);
			newNode && store.registerNode(newNode);
		}

		// 先 node-drop，再 node-dragend
		const base = { node, data: node.states.data, event: current.event as any };
		move && emit('node-drop', {
			...base,
			targetNode: dropNode!,
			position: position!,
			...move
		} satisfies TreeNodeDropPayload);
		emit('node-dragend', {
			...base,
			targetNode: dropNode,
			position,
			dropped: !!move
		} satisfies TreeNodeDragEndPayload);

		state.draggingNode = null;
		state.dropNode = null;
		state.dropType = '';
		state.allowDrop = true;
	};

	const drag = useDragDrop<TreeNode, DragSession>({ root, resolve, activate, start, update, finish });

	return {
		state,
		handleMousedown: drag.handleMousedown,
		handleTouchstart: drag.handleTouchstart
	};
};
