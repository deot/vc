import { toRaw } from 'vue';
import type { Store } from './store';
import type { RecycleListItemNodeRaw } from './base-watcher';

/**
 * 分块重排的块大小
 *
 * 每块起点记录一次列高快照，作为增量重排的入口；
 * 块越小重排范围越窄，但快照本身的内存与维护成本越高
 */
const CHUNK_SIZE = 256;

/**
 * 贪心选择当前最短的列
 *
 * inverted 取最后一个最小列，与旧实现的 findIndex / findLastIndex 保持一致
 * @param sizes 各列累积高度
 * @param inverted 是否倒置
 * @returns 列下标
 */
const pickColumn = (sizes: number[], inverted: boolean) => {
	let column = 0;
	for (let i = 1; i < sizes.length; i++) {
		if (inverted ? sizes[i] <= sizes[column] : sizes[i] < sizes[column]) {
			column = i;
		}
	}
	return column;
};

/**
 * 贪心最短列排列在扫描序上严格依赖前序结果，因此整表重排是 O(n)，
 * 而按批构建会让它退化成 O(n²)。
 *
 * 这里按扫描序分块，块起点保存"进入该块前的各列累积高度"，
 * 于是任意一次变化只需要从它所属的块重排到末尾：
 * 追加落在扫描序尾部，成本降到 O(批大小)。
 *
 * 扫描序：正序即数组下标；inverted 从数组末尾（视觉底部）开始。
 * 两种模式下新增项都落在扫描序尾部，块快照因此始终可复用
 */
export class Layout {
	/** 各块起点处的列高快照 */
	private checkpoints: number[][] = [];

	/** 上次重排时各扫描位采用的 size，用于定位第一个发生变化的位置 */
	private laidSizes: number[] = [];

	/** inverted 下各扫描位"距列底"的原始位置，反转成视觉位置时需要 */
	private laidOffsets: number[] = [];

	private laidLength = 0;
	private laidCols = 0;
	private laidInverted = false;
	private laidSource: RecycleListItemNodeRaw[] | null = null;

	constructor(private store: Store) {}

	/**
	 * 丢弃全部增量缓存，下次 refresh 从头重排
	 * 新增（增量分块重排）
	 */
	reset() {
		this.checkpoints = [];
		this.laidSizes = [];
		this.laidOffsets = [];
		this.laidLength = 0;
		this.laidSource = null;
	}

	/**
	 * 扫描序 -> 数组下标
	 * 新增（增量分块重排）
	 * @param length rebuildData 长度
	 * @param scan 扫描位
	 * @returns 对应的数组下标
	 */
	private indexAt(length: number, scan: number) {
		return this.laidInverted ? length - 1 - scan : scan;
	}

	/**
	 * 扫描序或数据源整体更换时整体失效
	 *
	 * 这两种情况下 size 比较不足以发现变化（新节点 size 同为 0）；
	 * 数组原地增删不改变身份，仍走增量
	 * @param rebuildData 当前节点列表（原始对象）
	 * @param cols 列数
	 * @param inverted 是否倒置
	 */
	private resetIfStale(rebuildData: RecycleListItemNodeRaw[], cols: number, inverted: boolean) {
		if (this.laidCols === cols && this.laidInverted === inverted && this.laidSource === rebuildData) return;
		this.reset();
		this.laidCols = cols;
		this.laidInverted = inverted;
		this.laidSource = rebuildData;
	}

	/**
	 * 第一个需要重排的扫描位
	 *
	 * 纯数字比较，比重排本身的响应式写入低一到两个数量级，
	 * 因此不要求调用方显式上报哪些项变脏。
	 * 两种脏信号：size 与上次重排结果不一致；column 为 -1
	 * （rebind/新建会重置几何信息，重测后 size 可能与原值相同，仅靠 size 无法发现）
	 * 新增（增量分块重排）
	 * @param rebuildData 当前节点列表
	 * @param length rebuildData 长度
	 * @returns 首个脏扫描位；若无脏点则为 min(length, laidLength)
	 */
	private findDirtyScan(rebuildData: RecycleListItemNodeRaw[], length: number) {
		const limit = Math.min(length, this.laidLength);
		for (let scan = 0; scan < limit; scan++) {
			const node = rebuildData[this.indexAt(length, scan)];
			if (!node) {
				if (this.laidSizes[scan] !== 0) return scan;
				continue;
			}
			if (node.raw.size !== this.laidSizes[scan] || node.raw.column < 0) return scan;
		}
		return limit;
	}

	/**
	 * 从脏点所属块的起点恢复列高快照；没有快照则从头开始
	 * @param dirtyScan 首个脏扫描位
	 * @param cols 列数
	 * @returns 重排起点与该处的列高
	 */
	private restoreCheckpoint(dirtyScan: number, cols: number) {
		const chunkIndex = Math.floor(dirtyScan / CHUNK_SIZE);
		const checkpoint = this.checkpoints[chunkIndex];
		return {
			startScan: checkpoint ? chunkIndex * CHUNK_SIZE : 0,
			sizes: checkpoint ? checkpoint.slice() : Array.from({ length: cols }, () => 0)
		};
	}

	/**
	 * 从 startScan 起按扫描序贪心放置，写 column（正序同时写 position）并续写列索引
	 *
	 * inverted 下此时算出的是"距列底"的偏移，先暂存到 laidOffsets，
	 * 等总高确定后由 resolveInvertedPositions 换算
	 * @param rebuildData 当前节点列表
	 * @param length rebuildData 长度
	 * @param startScan 重排起始扫描位
	 * @param sizes 起点处的列高（原地累加）
	 * @param columns 正序下待续写的列索引；inverted 为 null
	 */
	private place(
		rebuildData: RecycleListItemNodeRaw[],
		length: number,
		startScan: number,
		sizes: number[],
		columns: number[][] | null
	) {
		const inverted = this.laidInverted;
		for (let scan = startScan; scan < length; scan++) {
			if (scan % CHUNK_SIZE === 0) {
				this.checkpoints[scan / CHUNK_SIZE] = sizes.slice();
			}

			const node = rebuildData[this.indexAt(length, scan)];
			if (!node) {
				this.laidSizes[scan] = 0;
				continue;
			}

			const raw = node.raw;
			const column = pickColumn(sizes, inverted);
			const offset = sizes[column];

			if (raw.column !== column) node.states.column = column;
			if (inverted) {
				this.laidOffsets[scan] = offset;
			} else if (raw.position !== offset) {
				node.states.position = offset;
			}

			sizes[column] = offset + raw.size;
			this.laidSizes[scan] = raw.size;
			columns?.[column].push(scan);
		}
	}

	/**
	 * inverted：把"距列底"的偏移换算成视觉位置
	 *
	 * 总高每次追加都会变，所以这一遍无法增量
	 * @param rebuildData 当前节点列表
	 * @param length rebuildData 长度
	 * @param sizes 最终列高
	 */
	private resolveInvertedPositions(rebuildData: RecycleListItemNodeRaw[], length: number, sizes: number[]) {
		for (let index = 0; index < length; index++) {
			const node = rebuildData[index];
			if (!node) continue;
			const raw = node.raw;
			const position = sizes[raw.column] - this.laidOffsets[length - 1 - index] - raw.size;
			if (raw.position !== position) node.states.position = position;
		}
	}

	/**
	 * 提交 contentMaxSize 与 columnFillSize；仅在实际变化时写入，避免无效触发渲染
	 * @param sizes 最终列高
	 */
	private commit(sizes: number[]) {
		const { states } = this.store;
		const contentMaxSize = sizes.length === 1 ? sizes[0] : Math.max(...sizes);
		states.contentMaxSize = contentMaxSize;

		const columnFillSize = states.columnFillSize;
		if (
			columnFillSize.length !== sizes.length
			|| sizes.some((size, i) => columnFillSize[i] !== contentMaxSize - size)
		) {
			states.columnFillSize = sizes.map(size => contentMaxSize - size);
		}
	}

	/**
	 * 按扫描序增量重排 column / position，并同步 contentMaxSize、columnFillSize、列索引
	 * 原 Store.refreshItemPosition
	 */
	refresh() {
		const { props, states, position } = this.store;
		const { inverted, cols } = props;
		const rebuildData = toRaw(states.rebuildData);
		const length = rebuildData.length;

		this.resetIfStale(rebuildData, cols, inverted);

		const { startScan, sizes } = this.restoreCheckpoint(this.findDirtyScan(rebuildData, length), cols);
		this.checkpoints.length = Math.floor(startScan / CHUNK_SIZE);
		this.laidSizes.length = length;
		this.laidOffsets.length = inverted ? length : 0;
		this.laidLength = length;

		// 正序下扫描位等于数组下标，列索引可以截断后续写；inverted 位置需整体换算，索引只能全量重建
		const columns = inverted ? null : position.truncate(startScan, cols);
		this.place(rebuildData, length, startScan, sizes, columns);
		if (inverted) this.resolveInvertedPositions(rebuildData, length, sizes);

		this.commit(sizes);
		columns
			? position.set(columns, rebuildData)
			: position.rebuild();
	}
}
