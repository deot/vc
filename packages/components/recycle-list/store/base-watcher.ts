import { reactive, computed } from 'vue';
import type { Raw } from 'vue';
import type { Props } from '../recycle-list-props';
import type { RecycleListItemNode } from './node';
import type { Nodes } from './nodes';

export type RecycleListItemNodeRaw = Raw<RecycleListItemNode>;

export type RecycleListStates = {
	/**
	 * 封装后的数据，包含位置信息
	 */
	rebuildData: RecycleListItemNodeRaw[];
	/**
	 * 进行中的请求占位栈，仅消费数量
	 */
	loadings: string[];
	/**
	 * 内容最大高度（主轴方向）
	 */
	contentMaxSize: number;
	/**
	 * 各列相对最高列的填充高度；inverted 下用于对齐视觉底部
	 */
	columnFillSize: number[];
	/**
	 * 远程数据已全部加载
	 */
	isEnd: boolean;
	/**
	 * 静默刷新中：跳过 loadData 的常规入口，避免与刷新流程打架
	 */
	isSilentRefresh: boolean;
	/**
	 * 是否有进行中的远程请求（loadings.length > 0）
	 */
	isLoading: boolean;
	/**
	 * 每列交叉轴尺寸（百分比）；单列时不设
	 */
	columnSize: string | undefined;
	/**
	 * 每列为 gutter 让出的交叉轴总量
	 */
	columnOffsetGutter: number;
	/**
	 * 各列的 [头, 尾] padding，使列间距为 gutter 而首尾贴边
	 */
	columns: { index: number; offset: number[] }[];
	/**
	 * 可见范围（rebuildData 下标，闭区间）
	 */
	firstItemIndex: number;
	lastItemIndex: number;
	/**
	 * 待测量集合的变更计数，用于驱动 preData 重算
	 */
	pendingVersion: number;
	/**
	 * 按列分组的可见节点（含缓冲），供模板渲染
	 */
	data: RecycleListItemNodeRaw[][];
	/**
	 * 已有数据但尚未测量的节点，喂给 Defer 预渲染测高
	 */
	preData: RecycleListItemNodeRaw[];
};

/**
 * Store 的响应式状态容器；派生状态以 computed 内联在 reactive 中
 */
export class BaseWatcher {
	declare props: Props;
	declare nodes: Nodes;

	states: RecycleListStates = reactive({
		rebuildData: [],

		loadings: [],

		contentMaxSize: 0,
		columnFillSize: [],

		isEnd: false,
		isSilentRefresh: false,
		isLoading: computed(() => {
			return this.states.loadings.length > 0;
		}),

		columnSize: computed(() => {
			if (this.props.cols === 1) return;
			return `${100 / this.props.cols}%`;
		}),

		columnOffsetGutter: computed(() => {
			return this.props.gutter * (this.props.cols - 1) / this.props.cols;
		}),

		// 每列的 padding 之和恒为 columnOffsetGutter，相邻两列"前尾 + 后头"恰为 gutter
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
					Math.max(0, this.states.firstItemIndex - this.props.bufferCount),
					Math.min(this.states.rebuildData.length, this.states.lastItemIndex + this.props.bufferCount + 1)
				).reduce((pre, cur) => {
					cur && cur.states.column >= 0 && pre[cur.states.column].push(cur);
					return pre;
				}, base);
		}),

		pendingVersion: 0,
		// pending 是普通 Set，靠 pendingVersion 建立依赖
		preData: computed(() => {
			void this.states.pendingVersion;
			return Array.from(this.nodes.pending);
		})
	});
}
