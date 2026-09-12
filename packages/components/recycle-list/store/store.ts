import { reactive } from 'vue';
import { merge } from 'lodash-es';
import { props } from '../recycle-list-props';
import type { Props } from '../recycle-list-props';
import { BaseWatcher } from './base-watcher';
import { Layout } from './layout';
import { Position } from './position';
import { Local } from './local';
import { Nodes } from './nodes';
import { Scroll } from './scroll';

/**
 * 被 store 接管的 props：共享同一 Store 的多个实例以 store.props 为准，而非各自的组件 props
 */
const STORE_PROP_KEYS = ['batchCount', 'bufferCount', 'inverted', 'cols', 'gutter', 'loadData'] as const;

/**
 * 按组件 props 定义生成带默认值的响应式 store.props
 * @returns 响应式 props
 */
const createStoreProps = () => {
	return STORE_PROP_KEYS.reduce((pre, key) => {
		const definition: any = props[key];
		// 非函数类型的函数默认值是工厂，需要执行；Function 类型的默认值就是函数本身
		pre[key] = definition.type !== Function && typeof definition.default === 'function'
			? definition.default()
			: (definition.type ? definition.default : undefined);
		return pre;
	}, reactive({} as Record<string, any>)) as Props;
};

/**
 * 响应归一化为 { data, finished }：裸数组视为 { data }；
 * 未显式给 finished 时按内容推断，空页（data.length 为 0）才结束
 * @param response loadData 的返回值
 * @returns 归一化后的响应；无效响应原样返回
 */
const normalizeResponse = (response: any) => {
	if (Array.isArray(response)) {
		response = { data: response };
	}
	if (response && response.data && typeof response.finished === 'undefined') {
		response = { ...response, finished: !(response.data.length > 0) };
	}
	return response;
};

/**
 * RecycleList 的数据与布局中枢；可在多个实例间共享（props.store）
 *
 * - local：本地数据源与模拟分页
 * - nodes：节点池（创建 / 复用 / 回收）
 * - layout：增量重排
 * - position：列索引与可见范围
 * - scroll：多实例滚动联动
 */
export class Store extends BaseWatcher {
	/**
	 * 每页远程请求的 Promise 栈，长度即已发起次数
	 */
	promiseStack: Promise<any>[] = [];
	layout = new Layout(this);
	position = new Position(this);
	local = new Local(this);
	nodes = new Nodes(this);
	scroll = new Scroll();

	props = createStoreProps();

	constructor(options: Partial<Props>) {
		super();
		merge(this.props, options);
	}

	/**
	 * 绑定本地数据源并重建已构建区间的节点
	 *
	 * 先更新 local 游标，再按 builtBase / buildCount 重建节点池
	 * @param data 外部 data 数组
	 * @returns 是否发生了变更（同引用返回 false）
	 */
	setData(data: any[]): boolean {
		if (!this.local.setData(data)) return false;
		this.nodes.rebuild(
			this.local.builtBase,
			this.local.buildCount,
			index => this.local.originalData[index]
		);
		return true;
	}

	/**
	 * 拉取下一页远程数据，数据写入 originalData
	 *
	 * loadData 入参为 { current, count }：current 为第 N 次请求(从 1 开始)；count 为已加载总条数(可作偏移)
	 * @param onBeforeCommit 响应到达后、写入 states/originalData 之前的钩子（如清空旧列表）；原参数名 onBeforeResponse
	 * @returns 响应及数据写入的区间 [start, end)
	 */
	async fetchPage(onBeforeCommit?: () => void) {
		const current = this.promiseStack.length + 1;
		const start = this.local.originalData.length;
		const promiseFetch = this.props.loadData({ current, count: start });
		this.states.loadings.push('pending');
		this.promiseStack.push(promiseFetch);

		const response = normalizeResponse(await promiseFetch);
		onBeforeCommit && onBeforeCommit();
		this.states.loadings.pop();
		if (response && response.data) {
			this.local.write(start, response.data);
		}
		return { current, response, start, end: start + (response?.data?.length || 0) };
	}

	/**
	 * 终止加载，回收无效占位并重排
	 */
	stop() {
		this.states.isEnd = true;
		this.nodes.trimPlaceholders();
		this.layout.refresh();
	}

	/**
	 * 重置加载状态与数据栈
	 */
	reset() {
		this.states.isEnd = false;
		this.states.loadings = [];
		this.local.clear();
		this.promiseStack = [];
	}

	/**
	 * 清空列表内容
	 */
	clear() {
		this.setData([]);
		this.states.contentMaxSize = 0;
		this.states.columnFillSize = [];
		this.states.firstItemIndex = 0;
		this.states.isSilentRefresh = false;
	}
}
