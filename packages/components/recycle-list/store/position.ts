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
 * 列索引与可见范围查询
 *
 * 瀑布流里整表的 position 不单调，但每列内部单调，
 * 因此按列保存数组下标，滚动时对每列二分再合并
 */
export class Position {
	/**
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
	 * @param source 构建时的 rebuildData 原始引用
	 */
	set(columns: number[][], source: RecycleListItemNodeRaw[]) {
		this.columns = columns;
		this.source = source;
		this.sourceLength = source.length;
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
		this.set(columns, rebuildData);
		return columns;
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
	 *
	 * rebuildData 可能在两次 layout.refresh 之间被增删（占位预分配、裁剪），
	 * 此时列索引相对当前数组已失效，先全量重建再查
	 * 原 Store.setRangeByPosition
	 * @param headPosition 视口上沿（content 坐标系）
	 * @param tailPosition 视口下沿（content 坐标系）
	 */
	updateVisibleRange(headPosition: number, tailPosition: number) {
		const { inverted, cols } = this.store.props;
		const { states } = this.store;
		// 范围查询是命令式只读操作，绕过深层响应式代理可显著降低滚动热路径开销
		const rebuildData = toRaw(states.rebuildData);
		const columnFillSize = toRaw(states.columnFillSize);
		const length = rebuildData.length;

		if (length === 0) {
			states.firstItemIndex = 0;
			states.lastItemIndex = 0;
			return;
		}

		const stale = this.source !== rebuildData
			|| this.sourceLength !== length
			|| this.columns.length !== cols;
		const columns = stale ? this.rebuild() : this.columns;

		let firstIndex = length;
		let lastIndex = -1;
		for (let column = 0; column < columns.length; column++) {
			const indices = columns[column];
			// inverted 下每列相对最高列有底部填充，位置需整体下移
			const fillSize = inverted ? columnFillSize[column] : 0;
			const first = bisectFirst(indices.length, (i) => {
				const item = rebuildData[indices[i]];
				return item.raw.position + item.raw.size + fillSize >= headPosition;
			});
			const last = bisectLast(indices.length, (i) => {
				const item = rebuildData[indices[i]];
				return item.raw.position + fillSize <= tailPosition;
			});

			if (first <= last) {
				firstIndex = Math.min(firstIndex, indices[first]);
				lastIndex = Math.max(lastIndex, indices[last]);
			}
		}

		// 视口落在所有内容之外时保持原范围，避免闪空
		if (firstIndex === length || lastIndex < 0) return;
		if (firstIndex === states.firstItemIndex && lastIndex === states.lastItemIndex) return;
		states.firstItemIndex = firstIndex;
		states.lastItemIndex = lastIndex;
	}
}
