import { toRaw } from 'vue';
import type { Store } from './store';
import { RecycleListItemNode } from './node';
import type { RecycleListItemNodeRaw } from './base-watcher';

/**
 * 节点池：byIndex / pending / real 必须严格同步；
 * 创建与回收路径经 attach / detach，避免跨文件手工三连删
 */
export class Nodes {
	/** 数据索引 -> 节点；inverted 下数组下标与数据索引不对齐，靠它 O(1) 定位 */
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
	 * 创建新节点并登记
	 * @param index 数据索引
	 * @param data 行数据；缺省则为占位节点
	 * @returns 新建的节点
	 */
	create(index: number, data?: any) {
		const node = RecycleListItemNode.of({ index, data });
		return this.attach(index, node);
	}

	/**
	 * 有则 rebind 复用，无则新建（不登记；由调用方 attach）
	 * @param existing 已有节点；缺省则新建
	 * @param options 节点选项
	 * @param options.index 数据索引
	 * @param options.data 行数据；缺省则为占位
	 * @param options.loaded 是否已加载；缺省则 !!data
	 * @returns 复用或新建的节点
	 */
	private revive(
		existing: RecycleListItemNodeRaw | undefined,
		options: { index: number; data?: any; loaded?: boolean }
	) {
		return existing
			? existing.rebind(options)
			: RecycleListItemNode.of(options);
	}

	/**
	 * 优先复用 prevByIndex 中同索引节点（rebind），否则新建
	 * 原 Store.reuseOrCreateNode（private）
	 * @param prevByIndex 重建前的索引映射
	 * @param index 数据索引
	 * @param data 行数据
	 * @returns 复用或新建的节点
	 */
	reuseOrCreate(
		prevByIndex: Map<number, RecycleListItemNodeRaw>,
		index: number,
		data?: any
	) {
		const node = this.revive(prevByIndex.get(index), { index, data, loaded: false });
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
		this.sync(node);
	}

	/**
	 * 按数据索引写入行数据：有则 rebind，无则创建
	 * 原 Store.setItemData
	 * @param index 数据索引
	 * @param data 行数据；缺省则为占位
	 * @returns 更新后的节点
	 */
	upsert(index: number, data?: any) {
		const { states, props } = this.store;
		const existing = this.get(index);
		const node = this.revive(existing, { index, data });
		if (!existing) {
			props.inverted
				? states.rebuildData.unshift(node)
				: (states.rebuildData[index] = node);
		}
		return this.attach(index, node);
	}

	/**
	 * 构建 [start, end) 区间的节点，返回待测量的索引
	 * @param start 区间起点（含）
	 * @param end 区间终点（不含）
	 * @param reversed inverted 本地翻页时向前补建更早的数据，逆序后头部保持升序
	 * @returns 本次构建的数据索引列表
	 */
	build(start: number, end: number, reversed = false) {
		const { inverted } = this.store.props;
		const { originalData } = this.store.local;
		const indices: number[] = [];
		const created: RecycleListItemNodeRaw[] = [];
		let item: RecycleListItemNodeRaw | undefined;
		let shift = 0;
		for (let step = start; step < end; step++) {
			const index = reversed ? end - 1 - (step - start) : step;
			item = this.get(index);

			if (item && item.raw.loaded) continue;
			if (inverted && !item) {
				created.push(this.create(index, originalData[index]));
			} else {
				this.upsert(index, originalData[index]);
			}
			if (inverted) shift += 1;
			indices.push(index);
		}

		this.prepend(created);
		if (shift) {
			this.store.states.firstItemIndex += shift;
			this.store.states.lastItemIndex += shift;
		}
		return indices;
	}

	/**
	 * 预分配一批占位节点，返回待构建区间
	 * @returns 占位区间 [start, end)
	 */
	allocatePlaceholders() {
		const start = this.store.states.rebuildData.length;
		const end = start + this.store.props.batchCount;
		if (this.store.props.inverted) {
			const created: RecycleListItemNodeRaw[] = [];
			for (let i = start; i < end; i++) {
				created.push(this.create(i));
			}
			this.prepend(created);
		} else {
			this.store.states.rebuildData.length = end;
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
	 * 裁掉尾部（非 inverted）/ 头部（inverted）连续的无效占位节点
	 * @returns 是否发生裁剪
	 */
	trimPlaceholders(): boolean {
		const current = this.store.states.rebuildData;
		const length = current.length;
		let cursor: number;
		let trimmed: RecycleListItemNodeRaw[];
		if (!this.store.props.inverted) {
			for (cursor = length; cursor > 0; cursor--) {
				if (current[cursor - 1] && !current[cursor - 1].raw.isPlaceholder) break;
			}
			if (cursor === length) return false;
			trimmed = current.slice(cursor);
			this.store.states.rebuildData = current.slice(0, cursor);
		} else {
			for (cursor = 0; cursor < length; cursor++) {
				if (current[cursor] && !current[cursor].raw.isPlaceholder) break;
			}
			if (cursor === 0) return false;
			trimmed = current.slice(0, cursor);
			this.store.states.rebuildData = current.slice(cursor);
		}
		trimmed.forEach((item) => {
			if (!item) return;
			this.detach(item);
		});
		return true;
	}

	/**
	 * 标记全部已构建节点待重新测量
	 */
	invalidate() {
		this.store.states.rebuildData.forEach(item => item?.invalidate());
	}

	/**
	 * setData 后按已构建区间重建节点；count 为 0 时得到空数组
	 * 原 Store.setData 的节点重建段
	 * @param base 已构建区间在 originalData 中的起始下标
	 * @param count 已构建条数
	 * @param dataAt 按数据索引取行数据
	 */
	rebuild(base: number, count: number, dataAt: (index: number) => any) {
		const prevByIndex = this.store.states.rebuildData.reduce((pre, cur) => {
			if (cur) pre.set(cur.raw.index, cur);
			return pre;
		}, new Map<number, RecycleListItemNodeRaw>());

		this.clear();
		this.store.states.rebuildData = Array.from({ length: count }, (_, i) => {
			const index = base + i;
			return this.reuseOrCreate(prevByIndex, index, dataAt(index));
		});
	}
}
