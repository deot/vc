import { toRaw } from 'vue';
import type { Store } from './store';
import { RecycleListItemNode } from './node';
import type { RecycleListItemNodeRaw } from './base-watcher';

/**
 * 节点池：管理 rebuildData 中节点的创建、复用与回收
 *
 * byIndex / pending / real 三个集合必须与 rebuildData 严格同步；
 * 所有创建与回收路径都经 attach / detach，避免跨文件手工维护
 */
export class Nodes {
	/**
	 * 数据索引 -> 节点；inverted 下数组下标与数据索引不对齐，靠它 O(1) 定位
	 */
	byIndex = new Map<number, RecycleListItemNodeRaw>();

	/**
	 * 已有数据但尚未测量的节点
	 *
	 * 全量 filter 出这批节点是 O(n)，而它每批构建后都会被读取，
	 * 深滚动下同样会退化成 O(n²)，因此改为增量维护
	 */
	pending = new Set<RecycleListItemNodeRaw>();

	/**
	 * 已拿到数据的节点，用于 O(1) 判断当前是否只剩占位
	 */
	real = new Set<RecycleListItemNodeRaw>();

	constructor(private store: Store) {}

	/**
	 * 同步节点在 pending / real 集合中的归属；写入 size 或 data 后调用即可自洽
	 * 原 BaseWatcher.markPending
	 * @param node 目标节点
	 */
	sync(node: RecycleListItemNodeRaw) {
		const { isPlaceholder, size } = node.raw;
		const pending = !isPlaceholder && !size;

		if (pending !== this.pending.has(node)) {
			pending
				? this.pending.add(node)
				: this.pending.delete(node);
			this.store.states.pendingVersion++;
		}

		isPlaceholder
			? this.real.delete(node)
			: this.real.add(node);
	}

	/**
	 * 登记节点到 byIndex 并同步集合归属
	 * 原 nodeByIndex.set + markPending 内联
	 * @param index 数据索引
	 * @param node 目标节点
	 * @returns 登记后的节点
	 */
	attach(index: number, node: RecycleListItemNodeRaw) {
		this.byIndex.set(index, node);
		this.sync(node);
		return node;
	}

	/**
	 * 从 byIndex / pending / real 三处移除节点
	 * 原 Store.trimPlaceholders 内三连删
	 * @param node 目标节点
	 */
	detach(node: RecycleListItemNodeRaw) {
		this.byIndex.delete(node.raw.index);
		this.real.delete(node);
		if (this.pending.delete(node)) this.store.states.pendingVersion++;
	}

	/**
	 * 清空三个集合并 bump pendingVersion
	 * 原 Store.setData 内清空 nodeByIndex / pendingNodes / realNodes
	 */
	clear() {
		this.byIndex.clear();
		this.pending.clear();
		this.real.clear();
		this.store.states.pendingVersion++;
	}

	/**
	 * 按数据索引取节点；inverted 走 byIndex，正序直接按下标读 rebuildData
	 * @param index 数据索引
	 * @returns 节点；不存在时为 undefined
	 */
	get(index: number) {
		return this.store.props.inverted
			? this.byIndex.get(index)
			: this.store.states.rebuildData[index];
	}

	/**
	 * 创建新节点并登记（不放入 rebuildData，由调用方决定位置）
	 * @param index 数据索引
	 * @param data 行数据；缺省则为占位节点
	 * @returns 新建的节点
	 */
	create(index: number, data?: any) {
		return this.attach(index, RecycleListItemNode.of({ index, data }));
	}

	/**
	 * 复用已有节点：更新 index / data、清空几何并重新登记，保持 id 稳定
	 * 原 Nodes.revive / reuseOrCreate 的复用分支
	 * @param node 已有节点
	 * @param index 数据索引
	 * @param data 行数据；缺省则为占位
	 * @returns 复用后的节点
	 */
	rebind(node: RecycleListItemNodeRaw, index: number, data?: any) {
		node.rebind({ index, data });
		return this.attach(index, node);
	}

	/**
	 * 写入实测尺寸并同步 pending 归属
	 * 原 Store.setItemSize
	 * @param node 目标节点
	 * @param size 实测尺寸
	 */
	setSize(node: RecycleListItemNodeRaw, size: number) {
		if (node.raw.size !== size) node.states.size = size;
		if (size > 0) node.measured = true;
		this.sync(node);
	}

	/**
	 * 按数据索引写入单条行数据：有则 rebind，无则创建并放入 rebuildData
	 * 原 Store.setItemData
	 * @param index 数据索引
	 * @param data 行数据；缺省则为占位
	 * @returns 更新后的节点
	 */
	upsert(index: number, data?: any) {
		const existing = this.get(index);
		if (existing) return this.rebind(existing, index, data);

		const node = this.create(index, data);
		this.store.props.inverted
			? this.store.states.rebuildData.unshift(node)
			: (this.store.states.rebuildData[index] = node);
		return node;
	}

	/**
	 * 构建 [start, end) 区间的节点，返回待测量的节点
	 *
	 * 有数据且已测出尺寸的节点跳过（force 时不跳过）；其余的复用 rebind，不存在的新建。
	 * inverted 下新建节点整批插到头部，并把可见范围下标同步后移
	 * @param start 区间起点（含）
	 * @param end 区间终点（不含）
	 * @param options 构建选项
	 * @param options.reversed inverted 本地翻页时向前补建更早的数据，逆序后头部保持升序
	 * @param options.force 已测量的节点也重新构建，用于整体重测
	 * @returns 本次构建、待测量的节点
	 */
	build(start: number, end: number, options: { reversed?: boolean; force?: boolean } = {}) {
		const { states, props, local } = this.store;
		const { reversed, force } = options;
		const nodes: RecycleListItemNodeRaw[] = [];
		const created: RecycleListItemNodeRaw[] = [];

		for (let step = start; step < end; step++) {
			const index = reversed ? end - 1 - (step - start) : step;
			const existing = this.get(index);
			// 尺寸为 0 表示还没测出来，不能当成已完成
			if (!force && existing && !existing.raw.isPlaceholder && existing.raw.size > 0) continue;

			if (existing) {
				nodes.push(this.rebind(existing, index, local.originalData[index]));
				continue;
			}
			const node = this.create(index, local.originalData[index]);
			props.inverted
				? created.push(node)
				: (states.rebuildData[index] = node);
			nodes.push(node);
		}

		// 数组下标只因插到头部的新节点而后移，复用的节点不改变数组长度
		if (props.inverted && created.length) {
			this.prepend(created);
			states.firstItemIndex += created.length;
			states.lastItemIndex += created.length;
		}
		return nodes;
	}

	/**
	 * 预分配一批占位节点，返回待构建区间
	 *
	 * 正序只扩展数组长度（空洞在 build 时补齐），inverted 需要真实节点插到头部
	 * @returns 占位区间 [start, end)
	 */
	allocatePlaceholders() {
		const { states, props } = this.store;
		const start = states.rebuildData.length;
		const end = start + props.batchCount;
		if (props.inverted) {
			const created: RecycleListItemNodeRaw[] = [];
			for (let i = start; i < end; i++) {
				created.push(this.create(i));
			}
			this.prepend(created);
		} else {
			states.rebuildData.length = end;
		}
		return { start, end };
	}

	/**
	 * inverted 下新节点整批插到头部
	 *
	 * 逐个 unshift 在响应式数组上是 O(n) 搬移加 O(n) 代理触发，按批构建会退化成 O(n²)；
	 * 一次性替换数组只触发一次更新。逆序还原逐个 unshift 的最终顺序
	 * @param created 本批新建的节点（扫描序）
	 */
	private prepend(created: RecycleListItemNodeRaw[]) {
		if (!created.length) return;
		created.reverse();
		this.store.states.rebuildData = created.concat(toRaw(this.store.states.rebuildData));
	}

	/**
	 * 裁掉尾部（正序）/ 头部（inverted）连续的无效占位节点
	 * @returns 是否发生裁剪
	 */
	trimPlaceholders(): boolean {
		const { states, props } = this.store;
		const current = states.rebuildData;
		const length = current.length;
		const isInvalid = (node: RecycleListItemNodeRaw | undefined) => !node || node.raw.isPlaceholder;

		let count = 0;
		while (count < length && isInvalid(current[props.inverted ? count : length - 1 - count])) count++;
		if (count === 0) return false;

		const trimmed = props.inverted
			? current.slice(0, count)
			: current.slice(length - count);
		states.rebuildData = props.inverted
			? current.slice(count)
			: current.slice(0, length - count);
		trimmed.forEach(node => node && this.detach(node));
		return true;
	}

	/**
	 * setData 后按已构建区间重建节点，count 为 0 时得到空数组
	 *
	 * 节点跟着数据项走：与旧数组中引用相同（===）的数据项视为内容未变，认领原来承载它的节点，
	 * 沿用尺寸与几何、不再重测，id 不变，渲染时只是移动位置；删除、插入、排序因此只需测量新出现的数据项。
	 * 没有被认领的位置优先复用同索引的旧节点（保持 id 稳定），清空几何重新测量。
	 * 原 Store.setData 的节点重建段；复用/新建的选择原 Store.reuseOrCreateNode（private），此处内联为 existing ? rebind : create
	 * @param base 已构建区间在 originalData 中的起始下标
	 * @param count 已构建条数
	 * @param dataAt 按数据索引取行数据
	 */
	rebuild(base: number, count: number, dataAt: (index: number) => any) {
		// 数据项（raw）-> 原来承载它的节点；raw.data 经响应式写入，存的就是 raw
		const byData = new Map<any, RecycleListItemNodeRaw>();
		const byIndex = new Map<number, RecycleListItemNodeRaw>();
		this.store.states.rebuildData.forEach((node) => {
			if (!node) return;
			byIndex.set(node.raw.index, node);
			!node.raw.isPlaceholder && !byData.has(node.raw.data) && byData.set(node.raw.data, node);
		});

		// 先认领：同一个数据项出现多次时只有第一次认领到原节点
		const items = Array.from({ length: count }, (_, i) => dataAt(base + i));
		const claimed = new Set<RecycleListItemNodeRaw>();
		const owners = items.map((data) => {
			const node = data ? byData.get(toRaw(data)) : undefined;
			if (!node || claimed.has(node)) return;
			claimed.add(node);
			return node;
		});

		this.clear();
		this.store.states.rebuildData = items.map((data, i) => {
			const index = base + i;
			const owner = owners[i];
			// 尺寸为 0 的节点仍待测，交给下一次构建
			if (owner) return this.attach(index, owner.reuse({ index, data }));

			// 新的数据项：清空几何重新测量
			const existing = byIndex.get(index);
			if (!existing || claimed.has(existing)) return this.create(index, data);
			claimed.add(existing);
			return this.rebind(existing, index, data);
		});
	}
}
