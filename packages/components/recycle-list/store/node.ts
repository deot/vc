import { reactive, markRaw, toRaw } from 'vue';
import { getUid } from '@deot/helper-utils';

type Options = {
	index: number;
	data?: any;
	loaded?: boolean; // 缺省则 !!data
};

export class RecycleListItemNode {
	id = getUid('recycle-list-item');

	states = reactive({
		index: -1,
		data: {} as any,
		size: 0,
		position: -1000,
		column: -1,
		isPlaceholder: true,
		loaded: false,
	});

	/**
	 * states的原始对象，供布局重排的热路径读取几何信息
	 *
	 * 重排每轮都要遍历比较size，走响应式代理的开销会被放大到不可接受；
	 * 写入仍必须经过states，否则不会触发渲染更新
	 */
	raw = toRaw(this.states);

	static of(options: Options) {
		return new RecycleListItemNode(options);
	}

	constructor(options: Options) {
		markRaw(this);
		this.states.index = options.index;
		this.setData(options.data, options.loaded);
	}

	setData(data?: any, loaded?: boolean) {
		this.states.data = data || {};
		this.states.isPlaceholder = !data;
		this.states.loaded = loaded ?? !!data;
	}

	// 标记未测量，等待 nodes.build / refreshLayout 重新测高
	invalidate() {
		this.states.loaded = false;
	}

	// 复用节点：更新 index/data 并清空布局，保持 id 稳定
	rebind(options: Options) {
		this.states.index = options.index;
		this.states.size = 0;
		this.states.position = -1000;
		this.states.column = -1;
		this.setData(options.data, options.loaded);
		return this;
	}
}

export type RecycleListItemStates = RecycleListItemNode['states'];
