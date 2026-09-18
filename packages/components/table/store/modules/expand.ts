import { toRaw } from 'vue';
import { getRowValue } from '../../utils';
import type { Store } from '../store';

/**
 * 展开行（type="expand" 列）：
 * 展开状态按行记录在 store.states.expandMap（key 为字符串化的行值，无行值时为行对象），
 * 未记录的行取 defaultExpandAll，数据刷新后状态自然保留
 */
export class Expand {
	store: Store;

	constructor(store: Store) {
		this.store = store;
	}

	getKey(row: any) {
		const { primaryKey } = this.store.table.props;
		const value = primaryKey ? getRowValue(row, primaryKey) : void 0;
		// 缺少行值时退回行对象，避免这些行共用同一个 key
		return value == null ? toRaw(row) : `${value}`;
	}

	isExpanded(row: any) {
		const { expandMap } = this.store.states;
		const key = this.getKey(row);
		return expandMap.has(key) ? !!expandMap.get(key) : !!this.store.table.props.defaultExpandAll;
	}

	// 当前已展开的行，按渲染顺序
	getRows() {
		return this.store.states.renderData.filter((row: any) => this.isExpanded(row));
	}

	/**
	 * 切换行的展开状态
	 * @param row 行数据
	 * @param expanded 指定展开与否，省略时切换
	 */
	toggle(row: any, expanded?: boolean) {
		const current = this.isExpanded(row);
		const value = typeof expanded === 'boolean' ? expanded : !current;
		if (value === current) return;

		this.store.states.expandMap.set(this.getKey(row), value);
		this.store.table.emit('expand-change', row, this.getRows());
		this.store.scheduleLayout();
	}

	/**
	 * 设置展开的行（expand-row-value，需要 primaryKey），其余行取 defaultExpandAll
	 * @param values 展开行的行值
	 */
	reset(values: any[]) {
		const { expandMap } = this.store.states;
		expandMap.clear();
		values.forEach(value => expandMap.set(`${value}`, true));
	}

	/**
	 * 清理已不存在的行的展开状态
	 */
	prune() {
		const { expandMap } = this.store.states;
		if (!expandMap.size) return;
		const keys = new Set(this.store.tree.rows.map((row: any) => this.getKey(row)));
		// 遍历原始 Map：响应式 Map 的 forEach 会把对象 key 转为代理，与原始行对象比对不上
		toRaw(expandMap).forEach((_, key) => !keys.has(key) && expandMap.delete(key));
	}
}
