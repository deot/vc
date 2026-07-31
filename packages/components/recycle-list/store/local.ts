import type { Store } from './store';

/**
 * 本地数据源与模拟分页游标；
 * originalData 同时承接远程页落地，total / buildCount / builtBase 都是对它的索引
 */
export class Local {
	/**
	 * 外部传入的 data 引用，用于 setData 去重（同引用不重复重建）
	 */
	source: any[] | null = null;
	/**
	 * 展平后的原始数据；远程页也写入这里
	 */
	originalData: any[] = [];
	/**
	 * originalData 的总条数
	 */
	total = 0;
	/**
	 * 已构建（布局/测量）的条数；模拟分页游标
	 */
	buildCount = 0;

	constructor(private store: Store) {}

	/**
	 * 是否还有未构建的本地数据
	 * @returns 是否还有未构建数据
	 */
	get hasMore() {
		return this.buildCount < this.total;
	}

	/**
	 * 已构建区间在 originalData 中的起始下标；
	 * inverted 下尾部为视觉底部（初始可见区），取尾部切片
	 * @returns 已构建区间起始下标
	 */
	get builtBase() {
		return this.store.props.inverted ? this.total - this.buildCount : 0;
	}

	/**
	 * 已构建节点对应的原始索引区间 [base, base + rebuildData.length)
	 * @returns [起点, 终点)
	 */
	get builtRange(): [number, number] {
		const base = this.builtBase;
		return [base, base + this.store.states.rebuildData.length];
	}

	/**
	 * 绑定本地数据源并更新游标；同引用返回 false 跳过重建
	 * @param data 外部 data 数组
	 * @returns 是否发生了变更
	 */
	setData(data: any[]): boolean {
		if (data === this.source) return false;
		this.source = data;

		// 断开外部引用，避免 toRaw(data) 共享同一数组
		this.originalData = Array.from(data);

		this.total = data.length;
		// 模拟分页，初始只构建一批；数据变更时保留已构建进度，避免深滚动后内容塌缩
		this.buildCount = Math.min(this.total, Math.max(this.buildCount, this.store.props.batchCount));
		return true;
	}

	/**
	 * 把一批数据写入 originalData 的指定偏移处（远程分页落地）
	 * @param start 写入起始下标
	 * @param items 待写入的数据项
	 */
	setOriginalData(start: number, items: any[]) {
		for (let i = 0; i < items.length; i++) {
			this.originalData[start + i] = items[i];
		}
	}

	/**
	 * 本地数据模拟分页，消费下一批的构建区间并推进 buildCount
	 * @returns 待构建区间；无更多数据时返回 null
	 */
	consumePage(): { start: number; end: number; reversed: boolean } | null {
		if (!this.hasMore) return null;
		const size = Math.min(
			this.store.props.batchCount,
			this.total - this.buildCount
		);
		if (!this.store.props.inverted) {
			const start = this.buildCount;
			this.buildCount += size;
			return { start, end: start + size, reversed: false };
		}
		const end = this.total - this.buildCount;
		this.buildCount += size;
		return { start: end - size, end, reversed: true };
	}

	/**
	 * 清空 originalData（重置加载栈时调用）
	 */
	clearOriginalData() {
		this.originalData = [];
	}
}
