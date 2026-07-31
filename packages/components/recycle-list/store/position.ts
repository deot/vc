import { toRaw } from 'vue';
import type { Store } from './store';
import type { RecycleListItemNodeRaw } from './base-watcher';

/**
 * 第一个满足 isMatch 的下标；无匹配返回 length
 * @param length 搜索区间长度
 * @param isMatch 单调谓词（true 区段在右侧）
 * @returns 首个匹配下标
 */
const bisectFirst = (length: number, isMatch: (i: number) => boolean) => {
	let lo = 0;
	let hi = length;
	while (lo < hi) {
		const mid = (lo + hi) >>> 1;
		if (isMatch(mid)) {
			hi = mid;
		} else {
			lo = mid + 1;
		}
	}
	return lo;
};

/**
 * 最后一个满足 isMatch 的下标；无匹配返回 -1
 * @param length 搜索区间长度
 * @param isMatch 单调谓词（true 区段在左侧）
 * @returns 末个匹配下标
 */
const bisectLast = (length: number, isMatch: (i: number) => boolean) => {
	let lo = 0;
	let hi = length - 1;
	let last = -1;
	while (lo <= hi) {
		const mid = (lo + hi) >>> 1;
		if (isMatch(mid)) {
			last = mid;
			lo = mid + 1;
		} else {
			hi = mid - 1;
		}
	}
	return last;
};

/**
 * 列索引：每列内部位置单调，保存数组下标用于滚动范围二分；
 * source / sourceLength 用于判断相对当前 rebuildData 是否仍有效
 */
export class Position {
	/*
	 * 每列内部位置单调的数组下标列表
	 */
	columns: number[][] = [];
	/**
	 * 构建索引时的 rebuildData 身份，用于判断缓存是否仍有效
	 */
	source: RecycleListItemNodeRaw[] | null = null;
	/**
	 * 构建索引时 rebuildData 的长度
	 */
	sourceLength = 0;

	constructor(private store: Store) {}

	/**
	 * 写入列索引缓存
	 * 原 Store.setPositionIndex
	 * @param columns 每列的数组下标列表
	 * @param source 构建时的 rebuildData 引用
	 * @param sourceLength 构建时的 rebuildData 长度
	 */
	set(columns: number[][], source: RecycleListItemNodeRaw[], sourceLength: number) {
		this.columns = columns;
		this.source = source;
		this.sourceLength = sourceLength;
	}

	/**
	 * 按当前 rebuildData 全量重建列索引
	 * 原 Store.rebuildPositionIndex
	 * @returns 重建后的 columns
	 */
	rebuild() {
		const cols = this.store.props.cols;
		const columns = Array.from({ length: cols }, () => [] as number[]);
		const rebuildData = toRaw(this.store.states.rebuildData);
		for (let index = 0; index < rebuildData.length; index++) {
			const item = rebuildData[index];
			if (item && item.raw.column >= 0 && columns[item.raw.column]) {
				columns[item.raw.column].push(index);
			}
		}
		this.set(columns, rebuildData, rebuildData.length);
		return columns;
	}

	/**
	 * 相对当前 rebuildData 仍有效则复用 columns，否则全量重建
	 * @param rawRebuildData 当前 rebuildData 的原始引用
	 * @param cols 列数
	 * @returns 可用的列索引
	 */
	ensure(rawRebuildData: RecycleListItemNodeRaw[], cols: number) {
		const stale = this.source !== rawRebuildData
			|| this.sourceLength !== rawRebuildData.length
			|| this.columns.length !== cols;
		return stale ? this.rebuild() : this.columns;
	}

	/**
	 * 正序下扫描位等于数组下标，重排起点之后的列索引整段失效，
	 * 二分截断后由重排循环续写即可
	 * @param startScan 重排起始扫描位
	 * @param cols 列数
	 * @returns 截断后的 columns（可被续写）
	 */
	truncate(startScan: number, cols: number) {
		const { columns } = this;
		if (startScan === 0 || columns.length !== cols) {
			return Array.from({ length: cols }, () => [] as number[]);
		}

		for (let column = 0; column < cols; column++) {
			const indices = columns[column];
			indices.length = bisectFirst(indices.length, i => indices[i] >= startScan);
		}
		return columns;
	}

	/**
	 * 按视口位置二分计算可见范围，写入 firstItemIndex / lastItemIndex
	 * 原 Store.setRangeByPosition
	 * @param headPosition 视口上沿（内容坐标系）
	 * @param tailPosition 视口下沿（内容坐标系）
	 */
	updateVisibleRange(headPosition: number, tailPosition: number) {
		const { inverted, cols } = this.store.props;
		const { rebuildData, columnFillSize } = this.store.states;
		// 范围查询是命令式只读操作，绕过深层响应式代理可显著降低滚动热路径开销。
		const rawRebuildData = toRaw(rebuildData);
		const rawColumnFillSize = toRaw(columnFillSize);
		const length = rawRebuildData.length;

		if (length === 0) {
			this.store.states.firstItemIndex = 0;
			this.store.states.lastItemIndex = 0;
			return;
		}

		const prevFirst = this.store.states.firstItemIndex;
		const prevLast = this.store.states.lastItemIndex;

		const columns = this.ensure(rawRebuildData, cols);
		let firstIndex = length;
		let lastIndex = -1;

		for (let column = 0; column < columns.length; column++) {
			const indices = columns[column];
			const fillSize = inverted ? rawColumnFillSize[column] : 0;
			const first = bisectFirst(indices.length, (i) => {
				const item = rawRebuildData[indices[i]];
				return item.raw.position + item.raw.size + fillSize >= headPosition;
			});
			const last = bisectLast(indices.length, (i) => {
				const item = rawRebuildData[indices[i]];
				return item.raw.position + fillSize <= tailPosition;
			});

			if (first <= last) {
				firstIndex = Math.min(firstIndex, indices[first]);
				lastIndex = Math.max(lastIndex, indices[last]);
			}
		}

		if (firstIndex === length || lastIndex < 0) return;

		if (firstIndex === prevFirst && lastIndex === prevLast) return;
		this.store.states.firstItemIndex = firstIndex;
		this.store.states.lastItemIndex = lastIndex;
	}
}
