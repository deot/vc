import { shallowRef } from 'vue';
import type { ComputedRef } from 'vue';
import type { Store, RecycleListItemNodeRaw } from '../store';
import type { DirectionKeys } from './use-direction-keys';

/**
 * 节点尺寸测量：按节点登记已渲染 / 隐藏池中的元素，并把真实尺寸写回 store
 * @param store 数据中枢
 * @param keys 方向键映射
 * @param hasPlaceholder 是否有骨架，决定兜底尺寸是否可用
 * @returns 骨架引用、元素登记函数、进池判断与测量函数
 */
export const useMeasure = (
	store: Store,
	keys: DirectionKeys,
	hasPlaceholder: ComputedRef<any>
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
	const track = (target: Map<RecycleListItemNodeRaw, HTMLElement>, node: RecycleListItemNodeRaw, el?: HTMLElement) => {
		el ? target.set(node, el) : target.delete(node);
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
	 * 都读不到（占位节点）则用骨架尺寸
	 * 原 recycle-list.tsx measureNode
	 * @param node 待测量的节点
	 * @returns 被测量的节点；节点已被回收时为 undefined
	 */
	const measure = (node: RecycleListItemNodeRaw) => {
		if (!isAttached(node)) return;
		const el = pooledEls.get(node) || visibleEls.get(node);
		store.nodes.setSize(node, (el && el[keys.offsetSize]) || readFallbackSize());
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
		// 可见行挂的是 Resizer 实例，登记它的根元素：实例暴露的尺寸是去掉 padding 的浮点值，与隐藏池读到的整数口径不同
		trackVisible: (node: RecycleListItemNodeRaw, instance: any) => track(visibleEls, node, instance?.$el),
		trackPooled: (node: RecycleListItemNodeRaw, el: any) => track(pooledEls, node, el),
		measure,
		remeasureVisible
	};
};
