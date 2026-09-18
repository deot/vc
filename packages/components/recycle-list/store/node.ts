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

	states = reactive({
		/**
		 * 数据索引（originalData 下标）
		 */
		index: -1,
		data: {} as any,
		/**
		 * 主轴实测尺寸；0 表示尚未测量
		 */
		size: 0,
		/**
		 * 主轴位置（content 坐标系）；-1000 表示尚未布局
		 */
		position: -1000,
		/**
		 * 所属列；-1 表示尚未布局
		 */
		column: -1,
		/**
		 * 没有数据的骨架占位
		 */
		isPlaceholder: true
	});

	/**
	 * states 的原始对象，供布局重排的热路径读取几何信息
	 *
	 * 重排每轮都要遍历比较 size，走响应式代理的开销会被放大到不可接受；
	 * 写入仍必须经过 states，否则不会触发渲染更新
	 */
	raw = toRaw(this.states);

	/**
	 * 是否测量过（写入过非 0 尺寸），非响应式
	 *
	 * rebind 清空几何时保留它：节点再次待测时，据此区分「已经展示过、被重置的行」与「从未展示过的新行」
	 */
	measured = false;

	static of(options: Options) {
		return new RecycleListItemNode(options);
	}

	constructor(options: Options) {
		markRaw(this);
		this.states.index = options.index;
		this.setData(options.data);
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
		this.states.index = options.index;
		this.setData(options.data);
		return this;
	}

	// 复用节点：更新 index/data 并清空布局，保持 id 稳定
	rebind(options: Options) {
		this.states.index = options.index;
		this.states.size = 0;
		this.states.position = -1000;
		this.states.column = -1;
		this.setData(options.data);
		return this;
	}
}

export type RecycleListItemStates = RecycleListItemNode['states'];
