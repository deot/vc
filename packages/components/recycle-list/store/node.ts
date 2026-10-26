import { reactive, markRaw, toRaw } from 'vue';
import { getUid } from '@deot/helper-utils';

type Options = {
	index: number;
	data?: any;
};

/**
 * 列表项节点：一条数据在虚拟列表中的几何与加载状态
 *
 * 节点本身 markRaw，只有 states 是响应式的；id 在整个生命周期内稳定，
 * 复用（rebind）时保持不变以避免模板 key 抖动
 */
export class RecycleListItemNode {
	id = getUid('recycle-list-item');

	/**
	 * 节点状态（原始对象）：构建、重排的热路径直接读写它
	 *
	 * 几何（size / position / column）只经 raw 读写：重排与构建每轮都要遍历上万个节点，逐个经响应式代理的开销不可接受。
	 * 依赖几何的渲染（可见节点分组、列的 translate）改为依赖 store.states.layoutVersion，重排结束时统一触发一次。
	 * index / data / isPlaceholder 经 states 写入，行的内容依赖它们
	 */
	raw: RecycleListItemStates;

	// states 的响应式代理，首次访问时才创建：没有渲染过、内容也没变过的节点（长列表的绝大多数）不必各建一个代理
	private reactiveStates?: RecycleListItemStates;

	get states(): RecycleListItemStates {
		return this.reactiveStates || (this.reactiveStates = reactive(this.raw));
	}

	/**
	 * 这条数据上一次求得的预估尺寸（estimateSize），没有时为 0
	 *
	 * 只用来判断预估值有没有变：estimateSize 换了引用但取值没变（模板里的内联函数）时不必动已有的尺寸。
	 * 不参与渲染，不放进 states
	 */
	estimate = 0;

	static of(options: Options) {
		return new RecycleListItemNode(options);
	}

	constructor(options: Options) {
		markRaw(this);
		// data 存原始对象，与经代理写入（setData）时一致
		this.raw = {
			index: options.index,
			data: options.data ? toRaw(options.data) : {},
			size: 0,
			position: -1000,
			column: -1,
			isPlaceholder: !options.data
		};
	}

	setData(data?: any) {
		this.states.data = data || {};
		this.states.isPlaceholder = !data;
	}

	/**
	 * 复用节点并保留尺寸与几何：同一个数据项换了位置时使用，保持 id 稳定
	 *
	 * 位置与所属列留待重排更新；节点不会先从列中消失（等待其他项测量时白屏）再重新挂载
	 * @param options 索引与数据
	 * @returns 节点自身
	 */
	reuse(options: Options) {
		// 只在变了时写入：整体替换数据时多数节点认领回自己的数据项，逐个经代理写入相同的值也有开销
		this.raw.index !== options.index && (this.states.index = options.index);
		const data = options.data ? toRaw(options.data) : void 0;
		(this.raw.isPlaceholder ? data : this.raw.data !== data) && this.setData(data);
		return this;
	}

	// 复用节点：更新 index/data 并清空布局，保持 id 稳定
	rebind(options: Options) {
		this.estimate = 0;
		this.raw.size = 0;
		this.raw.position = -1000;
		this.raw.column = -1;
		this.reuse(options);
		return this;
	}
}

export type RecycleListItemStates = {
	/**
	 * 数据索引（originalData 下标）
	 */
	index: number;
	data: any;
	/**
	 * 主轴尺寸：实测值，或尚未渲染时的预估值（estimateSize / 替换数据前的旧尺寸）；0 表示既未测量也无预估
	 */
	size: number;
	/**
	 * 主轴位置（content 坐标系）；-1000 表示尚未布局
	 */
	position: number;
	/**
	 * 所属列；-1 表示尚未布局
	 */
	column: number;
	/**
	 * 没有数据的骨架占位
	 */
	isPlaceholder: boolean;
};
