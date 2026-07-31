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
 * 贪心最短列排列在扫描序上严格依赖前序结果，因此整表重排是 O(n)，
 * 而按批构建会让它退化成 O(n²)。
 *
 * 这里按扫描序分块，块起点保存"进入该块前的各列累积高度"，
 * 于是任意一次变化只需要从它所属的块重排到末尾：
 * 追加落在扫描序尾部，成本降到 O(批大小)。
 */
export class Layout {
	private store: Store;

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

	constructor(store: Store) {
		this.store = store;
	}

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
	 *
	 * inverted 时贪心从视觉底部（数组末尾）开始；两种模式下新增项都落在
	 * 扫描序尾部，块快照因此始终可复用
	 * 新增（增量分块重排）
	 * @param length rebuildData 长度
	 * @param scan 扫描位
	 * @returns 对应的数组下标
	 */
	private indexAt(length: number, scan: number) {
		return this.laidInverted ? length - 1 - scan : scan;
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
	 * 按扫描序增量重排 column / position
	 * 并同步 contentMaxSize、columnFillSize、列索引
	 * 原 Store.refreshItemPosition
	 */
	refresh() {
		const { props, states } = this.store;
		const { inverted, cols } = props;
		const rebuildData = toRaw(states.rebuildData);
		const length = rebuildData.length;

		// 扫描序或数据源整体更换时，size 比较不足以发现变化（新节点 size 同为 0），
		// 只能整体失效；数组原地增删不改变身份，仍走增量
		if (this.laidCols !== cols || this.laidInverted !== inverted || this.laidSource !== rebuildData) {
			this.reset();
			this.laidCols = cols;
			this.laidInverted = inverted;
			this.laidSource = rebuildData;
		}

		const dirtyScan = this.findDirtyScan(rebuildData, length);
		const chunkIndex = Math.floor(dirtyScan / CHUNK_SIZE);
		const checkpoint = this.checkpoints[chunkIndex];
		const startScan = checkpoint ? chunkIndex * CHUNK_SIZE : 0;
		const sizes = checkpoint ? checkpoint.slice() : Array.from({ length: cols }, () => 0);

		this.checkpoints.length = Math.floor(startScan / CHUNK_SIZE);
		this.laidSizes.length = length;
		this.laidOffsets.length = inverted ? length : 0;
		this.laidLength = length;

		const { position } = this.store;
		const columns = inverted ? null : position.truncate(startScan, cols);

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
			let column = 0;
			let offset = sizes[0];
			for (let i = 1; i < cols; i++) {
				// inverted 取最后一个最小列，与正序的 findIndex/findLastIndex 保持一致
				if (inverted ? sizes[i] <= offset : sizes[i] < offset) {
					offset = sizes[i];
					column = i;
				}
			}

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

		const contentMaxSize = cols === 1 ? sizes[0] : Math.max(...sizes);

		// inverted 的贪心结果是"距列底"的距离，需要按最终总高换算成视觉位置；
		// 总高每次追加都会变，所以这一遍无法增量
		if (inverted) {
			for (let index = 0; index < length; index++) {
				const node = rebuildData[index];
				if (!node) continue;
				const raw = node.raw;
				const _position = sizes[raw.column] - this.laidOffsets[length - 1 - index] - raw.size;
				if (raw.position !== _position) node.states.position = _position;
			}
		}

		states.contentMaxSize = contentMaxSize;

		const columnFillSize = states.columnFillSize;
		if (
			columnFillSize.length !== cols
			|| sizes.some((size, i) => columnFillSize[i] !== contentMaxSize - size)
		) {
			states.columnFillSize = sizes.map(size => contentMaxSize - size);
		}

		if (columns) {
			position.set(columns, rebuildData, length);
		} else {
			position.rebuild();
		}
	}
}
