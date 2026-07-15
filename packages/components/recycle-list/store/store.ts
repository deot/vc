import { reactive, toRaw } from 'vue';
import { merge } from 'lodash-es';
import { props } from '../recycle-list-props';
import type { Props } from '../recycle-list-props';
import { RecycleListItemNode } from './node';
import { BaseWatcher } from './base-watcher';
import type { RecycleListItemNodeRaw } from './base-watcher';

export class Store extends BaseWatcher {
	originalData: any[] = []; // 原始数据
	promiseStack: Promise<any>[] = []; // 每页数据栈信息
	currentLeaf: any = null;
	leafs: any[] = [];
	_data: any[] | null = null;
	localTotal = 0; // 本地数据(data)总条数
	buildCount = 0; // 本地数据已构建(布局/测量)的条数
	positionIndex: number[][] = []; // 每列内部位置单调，保存数据索引用于滚动范围二分
	positionIndexSource: any[] | null = null;
	positionIndexLength = 0;

	// 被store劫持的值
	props = ['batchSize', 'bufferSize', 'inverted', 'cols', 'gutter', 'loadData'].reduce((pre, cur) => {
		const v = props[cur];
		if (v.type !== Function && typeof v.default === 'function') {
			pre[cur] = v.default();
		} else {
			pre[cur] = v.type ? v.default : void 0;
		}
		return pre;
	}, reactive({} as Props)) as Props;

	constructor(options: Partial<Props>) {
		super();
		merge(this.props, options);
	}

	get hasMoreLocalData() {
		return this.buildCount < this.localTotal;
	}

	// 已构建节点对应的原始索引区间；inverted本地懒构建时不从0开始
	get builtRange(): [number, number] {
		const base = this.props.inverted ? this.localTotal - this.buildCount : 0;
		return [base, base + this.states.rebuildData.length];
	}

	// 本地数据(data)模拟分页，消费下一批的构建区间
	consumeLocalPage(): { start: number; end: number; reversed: boolean } | null {
		if (!this.hasMoreLocalData) return null;
		const size = Math.min(
			this.props.batchSize,
			this.localTotal - this.buildCount
		);
		if (!this.props.inverted) {
			const start = this.buildCount;
			this.buildCount += size;
			return { start, end: start + size, reversed: false };
		}
		const end = this.localTotal - this.buildCount;
		this.buildCount += size;
		return { start: end - size, end, reversed: true };
	}

	private reuseOrCreateNode(
		prevByIndex: Map<number, RecycleListItemNodeRaw>,
		index: number,
		$data?: any
	) {
		const existing = prevByIndex.get(index);
		if (existing) {
			return existing.rebind({ index, data: $data, loaded: false });
		}
		return RecycleListItemNode.of({ store: this, index, data: $data, loaded: false });
	}

	setData(data: any[]): boolean {
		if (data === this._data) return false;
		this._data = data;

		// 这里不要originalData = toRaw(data);
		this.originalData = [];
		data.forEach((i, index) => {
			this.originalData[index] = i;
		});

		this.localTotal = data.length;
		// 模拟分页，初始只构建一批；数据变更时保留已构建进度，避免深滚动后内容塌缩
		this.buildCount = Math.min(this.localTotal, Math.max(this.buildCount, this.props.batchSize));

		const prevByIndex = this.states.rebuildData.reduce((pre, cur) => {
			if (cur) pre.set(cur.states.index, cur);
			return pre;
		}, new Map<number, RecycleListItemNodeRaw>());

		if (!this.originalData.length) {
			this.states.rebuildData = [];
		} else {
			// inverted下尾部为视觉底部（初始可见区），已构建区间取尾部切片
			const base = this.props.inverted ? this.localTotal - this.buildCount : 0;
			this.states.rebuildData = Array.from({ length: this.buildCount }, (_, i) => {
				const index = base + i;
				return this.reuseOrCreateNode(prevByIndex, index, this.originalData[index]);
			});
		}
		return true;
	}

	setOriginData(start: number, res: any) {
		for (let i = 0; i < res.length; i++) {
			this.originalData[start + i] = res[i];
		}
	}

	setItemData(index: number, $data?: any) {
		const { states } = this;
		if (!this.props.inverted) {
			const existing = states.rebuildData[index];
			return existing
				? existing.rebind({ index, data: $data })
				: (states.rebuildData[index] = RecycleListItemNode.of({ store: this, index, data: $data }));
		}

		const index$ = states.rebuildDataIndexMap?.[index];
		if (typeof index$ === 'undefined') {
			const node = RecycleListItemNode.of({ store: this, index, data: $data });
			states.rebuildData.unshift(node);
			return node;
		}
		return states.rebuildData[index$].rebind({ index, data: $data });
	}

	/**
	 * 构建[start, end)区间的节点，返回待测量的索引
	 * @param start ~
	 * @param end ~
	 * @param reversed inverted本地翻页时向前补建更早的数据，逆序unshift后头部保持升序
	 * @returns indices ~
	 */
	buildItems(start: number, end: number, reversed = false) {
		const indices: number[] = [];
		let item: RecycleListItemNodeRaw | undefined;
		for (let j = start; j < end; j++) {
			const i = reversed ? end - 1 - (j - start) : j;
			item = this.props.inverted
				? this.states.rebuildData[this.states.rebuildDataIndexMap![i]]
				: this.states.rebuildData[i];

			if (item && item.states.loaded) continue;
			this.setItemData(i, this.originalData[i]);
			if (this.props.inverted) {
				this.states.firstItemIndex += 1;
				this.states.lastItemIndex += 1;
			}
			indices.push(i);
		}
		return indices;
	}

	// 预分配一批占位节点，返回待构建区间
	allocatePlaceholders() {
		const start = this.states.rebuildData.length;
		const end = start + this.props.batchSize;
		if (this.props.inverted) {
			for (let i = start; i < end; i++) {
				this.setItemData(i);
			}
		} else {
			this.states.rebuildData.length = end;
		}
		return { start, end };
	}

	// 标记全部已构建节点待重新测量
	invalidate() {
		this.states.rebuildData.forEach(item => item?.invalidate());
	}

	/**
	 * 拉取下一页远程数据，数据写入originalData
	 *
	 * loadData入参为{ current, count }：current为第N次请求(从1开始)；count为已加载总条数(可作偏移)
	 * 响应归一化为{ data, finished }：裸数组视为{ data }；
	 * 未显式给finished时按内容推断，空页(data.length为0)才结束
	 * @param onBeforeResponse ~
	 * @returns 响应及数据写入的区间[start, end)
	 */
	async fetchPage(onBeforeResponse?: () => void) {
		const current = this.promiseStack.length + 1;
		const start = this.originalData.length;
		const promiseFetch = this.props.loadData({ current, count: start });
		this.states.loadings.push('pending');
		this.promiseStack.push(promiseFetch);
		let response = await promiseFetch;
		if (Array.isArray(response)) {
			response = { data: response };
		}
		if (response && response.data && typeof response.finished === 'undefined') {
			response = { ...response, finished: !(response.data.length > 0) };
		}
		onBeforeResponse && onBeforeResponse();
		this.states.loadings.pop();
		if (response && response.data) {
			this.setOriginData(start, response.data);
		}
		return { current, response, start, end: start + (response?.data?.length || 0) };
	}

	// 终止加载，回收无效占位
	stop() {
		this.states.isEnd = true;
		this.trimPlaceholders();
		this.refreshItemPosition();
	}

	// 重置加载状态与数据栈
	reset() {
		this.states.isEnd = false;
		this.states.loadings = [];
		this.originalData = [];
		this.promiseStack = [];
	}

	// 清空列表内容
	clear() {
		this.setData([]);
		this.states.contentMaxSize = 0;
		this.states.columnFillSize = [];
		this.states.firstItemIndex = 0;
		this.states.isSlientRefresh = false;
	}

	rebuildPositionIndex() {
		const positionIndex = Array.from({ length: this.props.cols }).map(() => [] as number[]);
		const rebuildData = toRaw(this.states.rebuildData);
		for (let index = 0; index < rebuildData.length; index++) {
			const item = rebuildData[index];
			if (item && item.states.column >= 0 && positionIndex[item.states.column]) {
				positionIndex[item.states.column].push(index);
			}
		}
		this.positionIndex = positionIndex;
		this.positionIndexSource = rebuildData;
		this.positionIndexLength = rebuildData.length;
		return positionIndex;
	}

	refreshItemPosition() {
		const { inverted, cols } = this.props;
		const sizes = Array.from({ length: cols }).map(() => 0);
		const lastIndex = this.states.rebuildData.length - 1;
		let current: RecycleListItemNodeRaw | undefined;
		// 循环所有数据以更新item.position和总高度
		for (let i = 0; i <= lastIndex; i++) {
			current = this.states.rebuildData[inverted ? lastIndex - i : i];

			if (current) {
				const minSize = Math.min(...sizes);
				const minIndex = sizes[inverted ? 'findLastIndex' : 'findIndex'](v => v === minSize);

				current.states.position = sizes[minIndex] || 0;
				current.states.column = minIndex;

				sizes[minIndex] += current.states.size;
			}
		}

		if (inverted) {
			for (let i = 0; i <= lastIndex; i++) {
				current = this.states.rebuildData[i];

				if (current) {
					current.states.position = sizes[current.states.column] - current.states.position - current.states.size;
				}
			}
		}
		this.rebuildPositionIndex();

		this.states.contentMaxSize = Math.max(...sizes);
		this.states.columnFillSize = sizes.map(i => this.states.contentMaxSize - i);
	}

	// 裁掉尾部(非inverted)/头部(inverted)连续的无效占位节点，返回是否发生裁剪
	trimPlaceholders(): boolean {
		const copy = this.states.rebuildData.slice(0);
		let cursor: number;
		if (!this.props.inverted) {
			for (cursor = copy.length; cursor > 0; cursor--) {
				if (copy[cursor - 1] && !copy[cursor - 1].states.isPlaceholder) break;
			}
			if (cursor === copy.length) return false;
			this.states.rebuildData = copy.slice(0, cursor);
		} else {
			for (cursor = 0; cursor < copy.length; cursor++) {
				if (copy[cursor] && !copy[cursor].states.isPlaceholder) break;
			}
			if (cursor === 0) return false;
			this.states.rebuildData = copy.slice(cursor);
		}
		return true;
	}

	setRangeByPosition(headPosition: number, tailPosition: number) {
		const { inverted, cols } = this.props;
		const { rebuildData, columnFillSize } = this.states;
		// 范围查询是命令式只读操作，绕过深层响应式代理可显著降低滚动热路径开销。
		const rawRebuildData = toRaw(rebuildData);
		const rawColumnFillSize = toRaw(columnFillSize);
		const length = rawRebuildData.length;

		if (length === 0) {
			this.states.firstItemIndex = 0;
			this.states.lastItemIndex = 0;
			return;
		}

		const prevFirst = this.states.firstItemIndex;
		const prevLast = this.states.lastItemIndex;

		const sourceChanged = this.positionIndexSource !== rawRebuildData
			|| this.positionIndexLength !== length
			|| this.positionIndex.length !== cols;
		const positionIndex = sourceChanged ? this.rebuildPositionIndex() : this.positionIndex;
		let firstIndex = length;
		let lastIndex = -1;

		for (let column = 0; column < positionIndex.length; column++) {
			const indices = positionIndex[column];
			const fillSize = inverted ? rawColumnFillSize[column] : 0;
			let lo = 0;
			let hi = indices.length - 1;
			let first = indices.length;
			while (lo <= hi) {
				const mid = (lo + hi) >>> 1;
				const item = rawRebuildData[indices[mid]];
				if (item.states.position + item.states.size + fillSize >= headPosition) {
					first = mid;
					hi = mid - 1;
				} else {
					lo = mid + 1;
				}
			}

			lo = 0;
			hi = indices.length - 1;
			let last = -1;
			while (lo <= hi) {
				const mid = (lo + hi) >>> 1;
				const item = rawRebuildData[indices[mid]];
				if (item.states.position + fillSize <= tailPosition) {
					last = mid;
					lo = mid + 1;
				} else {
					hi = mid - 1;
				}
			}

			if (first <= last) {
				firstIndex = Math.min(firstIndex, indices[first]);
				lastIndex = Math.max(lastIndex, indices[last]);
			}
		}

		if (firstIndex === length || lastIndex < 0) return;

		if (firstIndex === prevFirst && lastIndex === prevLast) return;
		this.states.firstItemIndex = firstIndex;
		this.states.lastItemIndex = lastIndex;
	}

	add(leaf: any) {
		if (!this.currentLeaf) {
			this.currentLeaf = leaf;
		}
		leaf && this.leafs.push(leaf);
	}

	remove(leaf: any) {
		leaf && this.leafs.splice(this.leafs.indexOf(leaf), 1);
	}

	scrollTo(e: any) {
		if (!this.currentLeaf) return;
		for (let i = 0; i < this.leafs.length; i++) {
			if (this.leafs[i] === this.currentLeaf) continue;
			this.leafs[i].exposed.scrollTo({
				x: e.target.scrollLeft,
				y: e.target.scrollTop
			});
		}
	}
}
