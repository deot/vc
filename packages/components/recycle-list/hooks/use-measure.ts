import { shallowRef, onBeforeUnmount } from 'vue';
import type { ComputedRef } from 'vue';
import { Resize } from '@deot/helper-resize';
import type { Store, RecycleListItemNodeRaw } from '../store';
import type { DirectionKeys } from './use-direction-keys';

const SHARED = { shared: true };

/**
 * 节点尺寸测量：按节点登记已渲染 / 隐藏池中的元素，并把真实尺寸写回 store
 * @param store 数据中枢
 * @param keys 方向键映射
 * @param hasPlaceholder 是否有骨架，决定兜底尺寸是否可用
 * @param onRowResize 已渲染的行尺寸变化（含渲染出来时的首次测量）
 * @returns 骨架引用、元素登记函数、进池判断与测量函数
 */
export const useMeasure = (
	store: Store,
	keys: DirectionKeys,
	hasPlaceholder: ComputedRef<any>,
	onRowResize: (node: RecycleListItemNodeRaw) => void
) => {
	// 隐藏池里那份骨架 DOM，仅用于量兜底尺寸
	const placeholder = shallowRef();

	/**
	 * 已渲染项 / 隐藏测量池中的元素，按节点存放，卸载时删除
	 *
	 * 不能按下标存：节点会跟着数据项移动下标，而 Vue 更新时不会用 null 调用旧的函数 ref，
	 * 旧下标上会残留别的节点的元素，把 A 的尺寸写给 B
	 */
	const visibleEls = new Map<RecycleListItemNodeRaw, HTMLElement>();
	const pooledEls = new Map<RecycleListItemNodeRaw, HTMLElement>();

	/**
	 * 行尺寸监听：用 Resize 的共用模式，列表的所有行共用一个 ResizeObserver，同一轮里变化的行由一次回调带回，按元素找回节点
	 *
	 * 首次 observe 的回调即「行渲染出来时的首次测量」，之后行自身内容变化（展开、编辑、图片撑开等）也从这里上报；
	 * 行只是普通元素，不必每行一个组件实例与观察器
	 */
	const nodeOfEl = new WeakMap<Element, RecycleListItemNodeRaw>();
	const handleRowsResize = (entries: ResizeObserverEntry[]) => {
		entries.forEach((entry) => {
			const node = nodeOfEl.get(entry.target);
			node && onRowResize(node);
		});
	};
	onBeforeUnmount(() => Resize.disconnect(handleRowsResize));

	/**
	 * 行元素挂载：登记并开始观察
	 * @param node 节点
	 * @param el 行元素
	 */
	const observeRow = (node: RecycleListItemNodeRaw, el: HTMLElement) => {
		visibleEls.set(node, el);
		nodeOfEl.set(el, node);
		Resize.on(el, handleRowsResize, SHARED);
	};

	/**
	 * 行元素卸载：停止观察
	 *
	 * 节点换列（瀑布流重排）时新元素可能先于旧元素卸载前挂载，登记的已是新元素，按元素核对后再删
	 * @param node 节点
	 * @param el 行元素
	 */
	const unobserveRow = (node: RecycleListItemNodeRaw, el: HTMLElement) => {
		Resize.off(el, handleRowsResize, SHARED);
		nodeOfEl.delete(el);
		visibleEls.get(node) === el && visibleEls.delete(node);
	};

	// 骨架 DOM 的当前尺寸，作为测量兜底；不能缓存：列表变宽后骨架尺寸也会变
	const readFallbackSize = () => {
		if (!hasPlaceholder.value) return 0;
		return placeholder.value?.[keys.offsetSize] || 0;
	};

	// 节点仍在列表中（没有被 setData 回收或被 trimPlaceholders 裁掉）
	const isAttached = (node: RecycleListItemNodeRaw) => store.nodes.get(node.raw.index) === node;

	/**
	 * 读取节点 DOM 的实际尺寸写回 store
	 *
	 * 待测量节点都在隐藏池中渲染过，优先读池；已可见的节点兜底读列内元素；
	 * 都读不到时保留已有的预估尺寸（estimateSize），没有预估的（占位节点）用骨架尺寸
	 * 原 recycle-list.tsx measureNode
	 * @param node 待测量的节点
	 * @returns 被测量的节点；节点已被回收时为 undefined
	 */
	const measure = (node: RecycleListItemNodeRaw) => {
		if (!isAttached(node)) return;
		const el = pooledEls.get(node) || visibleEls.get(node);
		const size = el && el[keys.offsetSize];
		// 读不到元素时保留已有的尺寸（预估值）
		if (!size && node.raw.size) return node;
		store.nodes.setSize(node, size || readFallbackSize());
		return node;
	};

	/**
	 * 按已渲染的行元素重新读取尺寸，与记录不一致时写回
	 *
	 * 只处理已测过的节点，待测节点交给隐藏池；读不到尺寸（已卸载，或列表不可见读到 0）时不改动，避免把节点改回待测
	 * @param node 已渲染的节点
	 * @returns 尺寸有变化时返回该节点
	 */
	const remeasureVisible = (node: RecycleListItemNodeRaw) => {
		if (!isAttached(node) || node.raw.isPlaceholder || !node.raw.size || store.nodes.pending.has(node)) return;
		const size = visibleEls.get(node)?.[keys.offsetSize] || 0;
		if (!size || size === node.raw.size) return;
		store.nodes.setSize(node, size);
		return node;
	};

	return {
		placeholder,
		// 节点是否已经在隐藏池里渲染出来：等待测量的一批据此判断自己是否可以开始量
		isPooled: (node: RecycleListItemNodeRaw) => pooledEls.has(node),
		observeRow,
		unobserveRow,
		trackPooled: (node: RecycleListItemNodeRaw, el: any) => { el ? pooledEls.set(node, el) : pooledEls.delete(node); },
		measure,
		remeasureVisible
	};
};
