import { reactive, markRaw } from 'vue';
import { getUid } from '@deot/helper-utils';
import type { Store } from './store';

type Options = {
	store: Store;
	index: number;
	data?: any;
	loaded?: boolean; // 缺省则 !!data
};

export class RecycleListItemNode {
	id = getUid('recycle-list-item');
	store!: Store;

	states = reactive({
		index: -1,
		data: {} as any,
		size: 0,
		position: -1000,
		column: -1,
		isPlaceholder: true,
		loaded: false,
	});

	static of(options: Options) {
		return new RecycleListItemNode(options);
	}

	constructor(options: Options) {
		markRaw(this);
		this.store = options.store;
		this.states.index = options.index;
		this.setData(options.data, options.loaded);
	}

	setData(data?: any, loaded?: boolean) {
		this.states.data = data || {};
		this.states.isPlaceholder = !data;
		this.states.loaded = loaded ?? !!data;
	}

	// 标记未测量，等待 buildItems / refreshLayout 重新测高
	invalidate() {
		this.states.loaded = false;
	}

	// 复用节点：更新 index/data 并清空布局，保持 id 稳定
	rebind(options: Omit<Options, 'store'>) {
		this.states.index = options.index;
		this.states.size = 0;
		this.states.position = -1000;
		this.states.column = -1;
		this.setData(options.data, options.loaded);
		return this;
	}
}

export type RecycleListItemStates = RecycleListItemNode['states'];
