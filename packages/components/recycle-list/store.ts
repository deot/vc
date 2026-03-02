import { reactive, computed } from 'vue';
import { merge } from 'lodash-es';
import { props } from './recycle-list-props';
import type { Props } from './recycle-list-props';

export class Store {
	originalData: any[] = []; // 原始数据
	promiseStack: Promise<any>[] = []; // 每页数据栈信息
	currentLeaf: any = null;
	leafs: any[] = [];
	states = reactive({
		version: 0,
		rebuildData: [] as any[], // 封装后的数据，包含位置信息
		// 优化inverted下的find逻辑
		rebuildDataIndexMap: computed(() => {
			if (!this.props.inverted) return;
			return this.states.rebuildData.reduce((pre, cur, index) => {
				pre[cur.id] = index;
				return pre;
			}, {});
		}),

		loadings: [] as string[],

		contentMaxSize: 0,
		columnFillSize: [] as number[], // 优化inverted多列时用于补齐高度

		isEnd: false,
		isSlientRefresh: false,
		isLoading: computed(() => {
			return this.states.loadings.length;
		}),

		columnSize: computed(() => {
			if (this.props.cols === 1) return;
			return `${100 / this.props.cols}%`;
		}),

		columnOffsetGutter: computed(() => {
			return this.props.gutter * (this.props.cols - 1) / this.props.cols;
		}),

		columns: computed(() => {
			const v = Array.from({ length: this.props.cols }).map((_, index) => ({ index, offset: [0, 0] }));
			v[0].offset = [0, this.states.columnOffsetGutter];
			for (let i = 1; i < v.length; i++) {
				const pre = v[i - 1].offset;

				v[i].offset = [this.props.gutter - pre[1], this.states.columnOffsetGutter - this.props.gutter + pre[1]];
			}

			return v;
		}),

		firstItemIndex: 0,
		lastItemIndex: 0,
		/**
		 * 用于展示的信息
		 *
		 * 动态计算展示范围以及缓冲
		 */
		data: computed(() => {
			const base = Array.from({ length: this.props.cols }).map(() => []);
			return this.states.rebuildData
				.slice(
					Math.max(0, this.states.firstItemIndex - this.props.bufferSize),
					Math.min(this.states.rebuildData.length, this.states.lastItemIndex + this.props.bufferSize + 1)
				).reduce((pre, cur) => {
					cur.column >= 0 && pre[cur.column].push(cur);
					return pre;
				}, base);
		}),

		preData: computed(() => {
			return this.states.rebuildData.filter((i) => {
				return i && !i.isPlaceholder && !i.size;
			});
		})
	});

	// 被store劫持的值
	props = ['pageSize', 'bufferSize', 'inverted', 'cols', 'gutter', 'loadData'].reduce((pre, cur) => {
		const v = props[cur];
		if (v.type !== Function && typeof v.default === 'function') {
			pre[cur] = v.default();
		} else {
			pre[cur] = v.type ? v.default : void 0;
		}
		return pre;
	}, reactive({} as Props));

	constructor(options: Partial<Props>) {
		merge(this.props, options);
	}

	setData(data: any[]) {
		if (data.length % this.props.pageSize > 0) {
			this.states.isEnd = true;
		} else {
			this.promiseStack = Array
				.from({ length: Math.ceil(data.length / this.props.pageSize) })
				.map(() => Promise.resolve());
		}

		// 这里不要originalData = toRaw(data);
		this.originalData = [];
		data.forEach((i, index) => {
			this.originalData[index] = i;
		});

		if (!this.originalData.length) {
			this.states.rebuildData = [];
		} else {
			this.states.rebuildData = this.originalData.slice();
		}
		this.states.version++;
	}

	setOriginData(page: number, res: any) {
		const baseIndex = (page - 1) * this.props.pageSize;
		for (let i = 0; i < res.length; i++) {
			this.originalData[baseIndex + i] = res[i];
		}
	}

	setItemData(index: number, $data?: any) {
		const { states } = this;
		const node = {
			id: index,
			data: $data || {},
			size: 0,
			position: -1000,
			isPlaceholder: !$data,
			loaded: $data ? 1 : 0,

			// 在第几列渲染
			column: -1
		};
		if (!this.props.inverted) return (states.rebuildData[index] = node);

		const index$ = states.rebuildDataIndexMap[index];
		typeof index$ === 'undefined'
			? states.rebuildData.unshift(node)
			: (states.rebuildData[index$] = node);
	}

	refreshItemPosition() {
		const { inverted, cols } = this.props;
		const sizes = Array.from({ length: cols }).map(() => 0);
		const lastIndex = this.states.rebuildData.length - 1;

		let current: any;
		// 循环所有数据以更新item.top和总高度
		for (let i = 0; i <= lastIndex; i++) {
			current = this.states.rebuildData[inverted ? lastIndex - i : i];

			if (current) {
				const minSize = Math.min(...sizes);
				const minIndex = sizes[inverted ? 'findLastIndex' : 'findIndex'](v => v === minSize);

				current.position = sizes[minIndex] || 0;
				current.column = minIndex;

				sizes[minIndex] += current.size;
			}
		}

		if (inverted) {
			for (let i = 0; i <= lastIndex; i++) {
				current = this.states.rebuildData[i];

				if (current) {
					current.position = sizes[current.column] - current.position - current.size;
				}
			}
		}

		this.states.contentMaxSize = Math.max(...sizes);
		this.states.columnFillSize = sizes.map(i => this.states.contentMaxSize - i);
	}

	removeUnusedPlaceholders(copy: any[], page: number) {
		const start = (page - 1) * this.props.pageSize;
		const end = page * this.props.pageSize;
		let cursor: number;
		if (!this.props.inverted) {
			for (cursor = start; cursor < end; cursor++) {
				if (copy[cursor]?.isPlaceholder) break;
			}
			this.states.rebuildData = copy.slice(0, cursor);
		} else {
			for (cursor = 0; cursor < end - start; cursor++) {
				if (!copy[cursor]?.isPlaceholder) break;
			}
			this.states.rebuildData = copy.slice(cursor);
		}
	}

	setRangeByPosition(headPosition: number, tailPosition: number) {
		const rebuildData = this.states.rebuildData;
		const length = rebuildData.length;

		if (length === 0) {
			this.states.firstItemIndex = 0;
			this.states.lastItemIndex = 0;
			return;
		}

		const prevFirst = this.states.firstItemIndex;
		const prevLast = this.states.lastItemIndex;

		const isOverlap = (item: any, headPosition$: number) => {
			const tailPosition$ = this.props.inverted ? item.position - item.size : item.position + item.size;
			return item.position <= headPosition$ && tailPosition$ >= headPosition$;
		};

		/**
		 * 二分查找结合 isOverlap 精确定位
		 * @param target ~
		 * @param forward 正向扫描（未找到返回 -1）/反向扫描（未找到返回 length）
		 * @param hint prevFirst / prevLast）将二分范围从 [0, n-1] 收窄为 [hint, n-1] 或 [0, hint-1]，连续滚动时 O(log δ)
		 * @returns bound ~
		 */
		const upperBound = (target: number, forward?: boolean, hint = -1): number => {
			let lo = 0;
			let hi = length - 1;
			let bound = -1;

			if (hint >= 0 && hint < length) {
				const item = rebuildData[hint];
				if (!item || item.position <= target) {
					bound = hint;
					lo = hint;
				} else {
					hi = hint - 1;
				}
			}

			while (lo <= hi) {
				const mid = (lo + hi) >>> 1;
				const item = rebuildData[mid];
				if (!item || item.position <= target) {
					bound = mid;
					lo = mid + 1;
				} else {
					hi = mid - 1;
				}
			}

			if (forward) {
				const start = hint >= 0 && hint <= bound ? hint : 0; // hint <= bound（向下滚动）时，[0, hint-1] 已确认不满足 isOverlap，从 hint 开始扫描
				for (let i = start; i <= bound; i++) {
					if (!rebuildData[i] || isOverlap(rebuildData[i], target)) return i;
				}
				return -1;
			}

			for (let i = bound; i >= 0; i--) {
				if (!rebuildData[i] || isOverlap(rebuildData[i], target)) return i;
			}
			return length;
		};

		const firstIndex = Math.max(0, upperBound(headPosition, true, prevFirst));
		const lastIndex = Math.min(length - 1, upperBound(tailPosition, false, prevLast));

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
