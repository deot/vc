import { reactive, computed } from 'vue';
import type { Raw } from 'vue';
import type { Props } from '../recycle-list-props';
import type { RecycleListItemNode } from './node';

export type RecycleListItemNodeRaw = Raw<RecycleListItemNode>;

export type RecycleListStates = {
	/**
	 * 封装后的数据，包含位置信息
	 */
	rebuildData: RecycleListItemNodeRaw[];
	/**
	 * 优化inverted下的find逻辑
	 */
	rebuildDataIndexMap: Record<number, number> | undefined;
	/**
	 * 加载状态
	 */
	loadings: string[];
	/**
	 * 内容最大高度
	 */
	contentMaxSize: number;
	columnFillSize: number[];
	isEnd: boolean;
	isSlientRefresh: boolean;
	isLoading: number;
	columnSize: string | undefined;
	columnOffsetGutter: number;
	columns: { index: number; offset: number[] }[];
	firstItemIndex: number;
	lastItemIndex: number;
	/**
	 * 用于展示的信息
	 *
	 * 动态计算展示范围以及缓冲
	 */
	data: RecycleListItemNodeRaw[][];
	preData: RecycleListItemNodeRaw[];
};

export class BaseWatcher {
	declare props: Props;

	states: RecycleListStates = reactive({
		rebuildData: [],
		rebuildDataIndexMap: computed(() => {
			if (!this.props.inverted) return;
			return this.states.rebuildData.reduce((pre, cur, index) => {
				if (cur) pre[cur.states.index] = index;
				return pre;
			}, {} as Record<number, number>);
		}),

		loadings: [],

		contentMaxSize: 0,
		columnFillSize: [],

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
		data: computed(() => {
			const base = Array.from({ length: this.props.cols }).map(() => [] as RecycleListItemNodeRaw[]);
			return this.states.rebuildData
				.slice(
					Math.max(0, this.states.firstItemIndex - this.props.bufferSize),
					Math.min(this.states.rebuildData.length, this.states.lastItemIndex + this.props.bufferSize + 1)
				).reduce((pre, cur) => {
					cur && cur.states.column >= 0 && pre[cur.states.column].push(cur);
					return pre;
				}, base);
		}),

		preData: computed(() => {
			return this.states.rebuildData.filter((i) => {
				return i && !i.states.isPlaceholder && !i.states.size;
			});
		})
	});
}
