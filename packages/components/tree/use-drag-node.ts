import { toRaw } from 'vue';
import type { Ref } from 'vue';
import type { Nullable } from '@deot/helper-shared';
import {
	autoScrollOuter,
	createGhost,
	createIndicator,
	getOuterRange,
	isInteractive,
	resolveOuterCarrier,
	toRootOffset,
	useDragDrop
} from '../drag';
import type { DragDropState, RootOffset } from '../drag';
import type { ExternalCarrier } from '../scroller/carrier';
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
 * @param from 被拖节点移动前的位置（拖动中不变，可传入已算好的）
 * @returns 移动前后的位置
 */
const getMove = (node: TreeNode, target: TreeNode, position: TreeDropPosition, from = getPlace(node)): TreeMove => {
	const parent = position === 'inner' ? target : target.parentNode!;
	let index = position === 'inner'
		? target.childNodes.length
		: indexIn(parent, target) + (position === 'after' ? 1 : 0);
	// 同一父节点内，被拖节点在插入位置之前：移除后插入位置前移一位
	if (toRaw(node.parentNode) === toRaw(parent) && indexIn(parent, node) < index) index--;
	return { from, to: { parent: toParent(parent), index } };
};

// ancestor 是否是 node 的祖先：沿父节点向上，只与层级深度有关
const isAncestor = (ancestor: TreeNode, node: TreeNode) => {
	for (let parent = node.parentNode; parent; parent = parent.parentNode) {
		if (parent === ancestor) return true;
	}
	return false;
};

type DragOptions = {
	props: Props;
	store: TreeStore;
	emit: (event: any, ...args: any[]) => void;
	// 树的根节点（position: relative）
	root: Ref<Nullable<HTMLElement>>;
	// 元素所在的行及其节点 / 节点所在的行
	getNodeAt: (target: EventTarget | null) => { row: Element; node: TreeNode } | undefined;
	getElement: (node: TreeNode) => Element | undefined;
};

// 能否放到目标节点的各个区域
type DropFlags = {
	// 使用方（allowDrop）允许任一区域：允许时目标才成为落点
	allowed: boolean;
	// 使用方允许 inner
	userInner: boolean;
	// 再去掉不改变位置、放进自身子树的区域后
	prev: boolean;
	inner: boolean;
	next: boolean;
};

// 激活后的拖拽会话
type DragSession = {
	ghost: HTMLElement;
	indicator: HTMLElement;
	// 按下点到被拖行顶部的距离：跟随元素保持这段距离
	grabY: number;
	outer: ExternalCarrier;
	// 被拖节点拖动前的位置（拖动中不变）
	from: TreeDropPlace;
	// 当前落点
	dropNode: TreeNode | null;
	dropType: TreeDropPosition | null;
	// 当前落点所在的行（inner 时加 is-drop-inner）
	dropEl: Element | null;
	// 上一次判断过的目标节点及其结果：目标不变时不再重复询问 allowDrop、查找兄弟与祖先
	flagsOf: TreeNode | null;
	flags: DropFlags | null;
};

type DragState = DragDropState<TreeNode, DragSession>;

/**
 * 节点拖拽（指针事件，见 useDragDrop；不用原生拖拽，虚拟化时被拖行滚出视口被回收也不影响）：
 * 	- 从节点任意位置按下（输入框、复选框、展开图标等交互元素与带 vc-drag-ignore 的元素除外），越过阈值后开始；触摸需长按
 * 	- 跟随元素（被拖行内容的克隆）随指针纵向移动；指针所在的节点按内容行划分 before / inner / after，before / after 画插入线，inner 高亮目标
 * 	- 指针靠近树所在滚动容器的上下边缘时自动滚动；Esc、失焦取消
 * 	- 松手：有落点时移动节点，先发出 node-drop，再发出 node-dragend；各事件的 event 为最近一次的指针事件
 * @param options ~
 * 	- 根节点在拖拽中带 is-dragging，不能放下时带 is-drop-not-allow，inner 时带 is-drop-inner（命令式写入，拖动过程不触发渲染）
 * @returns handleMousedown / handleTouchstart：绑在根节点上
 */
export const useDragNode = (options: DragOptions) => {
	const { props, store, emit, root, getNodeAt, getElement } = options;

	const toggleRootClass = (name: string, value: boolean) => root.value?.classList.toggle(name, value);

	// 询问能否放到目标节点的某个区域
	const canDrop = (node: TreeNode, target: TreeNode, position: TreeDropPosition, from: TreeDropPlace) => {
		if (typeof props.allowDrop !== 'function') return true;
		return !!props.allowDrop({
			node,
			data: node.states.data,
			targetNode: target,
			position,
			...getMove(node, target, position, from)
		} satisfies TreeAllowDropPayload);
	};

	// 能否放到目标节点的各个区域（同一目标只判断一次）
	const getFlags = (session: DragSession, node: TreeNode, dropNode: TreeNode): DropFlags => {
		if (session.flagsOf === dropNode && session.flags) return session.flags;
		const prev = canDrop(node, dropNode, 'before', session.from);
		const userInner = canDrop(node, dropNode, 'inner', session.from);
		const next = canDrop(node, dropNode, 'after', session.from);
		// 放进自身或自己的子孙：都不行
		const self = node === dropNode || isAncestor(node, dropNode);
		const flags = {
			allowed: prev || userInner || next,
			userInner,
			// 紧挨着的前一个 / 后一个、已是它的子节点：放下后位置不变
			prev: prev && !self && dropNode.getPreviousSiblingNode() !== node,
			inner: userInner && !self && node.parentNode !== dropNode,
			next: next && !self && dropNode.getNextSiblingNode() !== node
		};
		session.flagsOf = dropNode;
		session.flags = flags;
		return flags;
	};

	const resolve = (target: HTMLElement) => {
		const hit = props.draggable && root.value ? getNodeAt(target) : void 0;
		if (!hit || isInteractive(target, hit.row)) return null;
		const { node } = hit;
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
			from: getPlace(current.source),
			dropNode: null,
			dropType: null,
			dropEl: null,
			flagsOf: null,
			flags: null
		};
	};

	const start = (current: DragState) => {
		const node = current.source;
		toggleRootClass('is-dragging', true);
		emit('node-dragstart', { node, data: node.states.data, event: current.event } satisfies TreeNodeDragPayload);
	};

	/**
	 * 指针所在的节点：计算落点区域，更新插入线与 inner 高亮，发出 dragenter / dragleave / dragover（先读后写）
	 * @param current 拖拽状态
	 * @param session 拖拽会话
	 * @param offset 根节点偏移（本帧已测量）
	 */
	const hover = (current: DragState, session: DragSession, offset: RootOffset) => {
		const hit = getNodeAt(document.elementFromPoint(current.clientX, current.clientY));
		// 不在节点上：保持上一个落点
		if (!hit) return;
		const { row, node: dropNode } = hit;

		const node = current.source;
		const payload = (targetNode: TreeNode): TreeNodeDragOverPayload => ({
			node,
			data: node.states.data,
			targetNode,
			event: current.event
		});

		const flags = getFlags(session, node, dropNode);
		if (flags.allowed) {
			const oldDropNode = session.dropNode;
			if (oldDropNode !== dropNode) {
				oldDropNode && emit('node-dragleave', payload(oldDropNode));
				emit('node-dragenter', payload(dropNode));
			}
			session.dropNode = dropNode;
		}

		const { prev: dropPrev, inner: dropInner } = flags;
		// 展开且有子节点：它的下方紧接第一个子节点，插入线会画在两者之间，而 after 会放到整棵子树之后
		const dropNext = flags.next && !(dropNode.states.expanded && dropNode.childNodes.length);

		// 按节点自己的内容行划分区域
		const content = row.querySelector(':scope > .vc-tree-node__content')!;
		const target = content.getBoundingClientRect();
		const prevPercent = dropPrev ? (dropInner ? 0.25 : (dropNext ? 0.45 : 1)) : -1;
		const nextPercent = dropNext ? (dropInner ? 0.75 : (dropPrev ? 0.55 : 0)) : 1;
		const distance = current.clientY - target.top;
		let dropType: TreeDropPosition | null = null;
		if (distance < target.height * prevPercent) {
			dropType = 'before';
		} else if (distance > target.height * nextPercent) {
			dropType = 'after';
		} else if (dropInner) {
			dropType = 'inner';
		}
		const icon = content.querySelector('.vc-tree-node__expand-icon')!.getBoundingClientRect();

		// 插入线：展开图标之后，落点之前 / 之后
		const showIndicator = dropType === 'before' || dropType === 'after';
		session.indicator.style.display = showIndicator ? '' : 'none';
		session.indicator.style.top = `${(dropType === 'before' ? icon.top : icon.bottom) - offset.top}px`;
		session.indicator.style.left = `${icon.right - offset.left}px`;

		// inner 时高亮目标行
		const innerEl = dropType === 'inner' ? row : null;
		if (session.dropEl !== innerEl) {
			session.dropEl?.classList.remove('is-drop-inner');
			innerEl?.classList.add('is-drop-inner');
			session.dropEl = innerEl;
		}

		session.dropType = dropType;
		toggleRootClass('is-drop-not-allow', !showIndicator && !flags.userInner);
		toggleRootClass('is-drop-inner', dropType === 'inner');
		emit('node-dragover', payload(dropNode));
	};

	const update = (current: DragState, session: DragSession) => {
		const el = root.value;
		if (!el) return;
		// 指针靠近树的可见范围上下边缘、且树在该方向被滚动容器遮住时，滚动容器；滚动后重新测量
		let rect = el.getBoundingClientRect();
		const scrolled = autoScrollOuter(session.outer, getOuterRange(rect, session.outer), current.clientY);
		scrolled && (rect = el.getBoundingClientRect());
		const offset = toRootOffset(el, rect);

		hover(current, session, offset);
		session.ghost.style.top = `${current.clientY - session.grabY - offset.top}px`;
		return scrolled;
	};

	const finish = (current: DragState, session: DragSession, commit: boolean) => {
		session.ghost.remove();
		session.indicator.remove();
		session.dropEl?.classList.remove('is-drop-inner');

		const node = current.source;
		const { dropNode } = session;
		const position = commit && dropNode ? session.dropType : null;
		// 移动前计算位置
		const move = dropNode && position ? getMove(node, dropNode, position, session.from) : null;

		if (move && dropNode) {
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
		const base = { node, data: node.states.data, event: current.event };
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

		toggleRootClass('is-dragging', false);
		toggleRootClass('is-drop-not-allow', false);
		toggleRootClass('is-drop-inner', false);
	};

	const drag = useDragDrop<TreeNode, DragSession>({ root, resolve, activate, start, update, finish });

	return {
		handleMousedown: drag.handleMousedown,
		handleTouchstart: drag.handleTouchstart
	};
};
