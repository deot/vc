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

	// 被 store 劫持的值
	props = ['batchCount', 'bufferCount', 'inverted', 'cols', 'gutter', 'loadData'].reduce((pre, cur) => {
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
	 * 响应归一化为 { data, finished }：裸数组视为 { data }；
	 * 未显式给 finished 时按内容推断，空页(data.length 为 0)才结束
	 * @param onBeforeCommit 响应到达后、写入 states/originalData 之前的钩子（如清空旧列表）；原参数名 onBeforeResponse
	 * @returns 响应及数据写入的区间 [start, end)
	 */
	async fetchPage(onBeforeCommit?: () => void) {
		const current = this.promiseStack.length + 1;
		const start = this.local.originalData.length;
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
		onBeforeCommit && onBeforeCommit();
		this.states.loadings.pop();
		if (response && response.data) {
			this.local.setOriginalData(start, response.data);
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
		this.local.clearOriginalData();
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
