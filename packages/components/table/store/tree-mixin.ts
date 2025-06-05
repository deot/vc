import { computed, watch, reactive, nextTick } from 'vue';

import { max } from 'lodash-es';
import { walkTreeNode, getRowIdentity } from '../utils';
import { VcError } from '../../vc';
import type { Store } from './store';

export class Tree {
	store: Store;

	/**
	 * 解决问题嵌入型的数据，watch 无法是检测到变化
	 * TODO: 是否会造成性能问题？同base-watcher flattenData
	 * { id: { level, children } }
	 */
	normalizedData = computed(() => {
		const { rowKey } = this.store.table.props;
		if (!rowKey) return {};

		return this.normalize(this.store.states.data || []);
	});

	/**
	 * 针对懒加载的情形，不处理嵌套数据
	 * { id: { children } }
	 */
	normalizedLazyNode = computed(() => {
		const { rowKey } = this.store.table.props;
		const { treelazyNodeMap, treeLazyColumnIdentifier, treeChildrenColumnName } = this.store.states;
		const keys = Object.keys(treelazyNodeMap);
		const res = {};
		if (!keys.length) return res;
		keys.forEach((key) => {
			if (treelazyNodeMap[key].length) {
				const item: any = { children: [] };
				treelazyNodeMap[key].forEach((row: any) => {
					const id = getRowIdentity(row, rowKey);
					item.children.push(id);

					const hasChildren = row[treeLazyColumnIdentifier] || (row[treeChildrenColumnName] && row[treeChildrenColumnName].length === 0);
					if (hasChildren && !res[id]) {
						res[id] = { children: [] };
					}
				});
				res[key] = item;
			}
		});
		return res;
	});

	constructor(store: Store) {
		this.store = store;

		watch(
			() => [this.normalizedData.value, this.normalizedLazyNode.value],
			() => this.update(),
		);
	}

	normalize(data: any[]) {
		const { rowKey } = this.store.table.props;
		const { treeChildrenColumnName, treeLazyColumnIdentifier, treeLazy } = this.store.states;
		const res = {};
		walkTreeNode(
			data,
			(parent: any, children: any[], level: number) => {
				const parentId = getRowIdentity(parent, rowKey);
				if (Array.isArray(children)) {
					res[parentId] = {
						children: children.map(row => getRowIdentity(row, rowKey)),
						level
					};
				} else if (treeLazy) {
					// 当 children 不存在且 lazy 为 true，该节点即为懒加载的节点
					res[parentId] = {
						children: [],
						lazy: true,
						level
					};
				}
			},
			{
				childrenKey: treeChildrenColumnName,
				lazyKey: treeLazyColumnIdentifier
			}
		);
		return res;
	}

	// 获取当前展开最大的level
	getMaxLevel() {
		const { rowKey } = this.store.table.props;
		const { data, treeData } = this.store.states;

		const levels = data.map((item) => {
			const traverse = (source: any) => {
				if (!source) return 0;
				if (source.expanded && source.children.length > 0) {
					return max([source.level, ...source.children.map((key: any) => traverse(treeData[key]))]);
				} else {
					return source.level;
				}
			};

			const id = getRowIdentity(item, rowKey);
			return traverse(treeData[id]);
		});
		return max(levels) || 0;
	}

	update() {
		const nested = this.normalizedData.value;
		const normalizedLazyNode = this.normalizedLazyNode.value;
		const keys = Object.keys(nested);
		const newTreeData = {};
		if (keys.length) {
			const { defaultExpandAll } = this.store.table.props;
			const { treeData: oldTreeData, treeExpandRowValue, treeLazy } = this.store.states;
			const rootLazyRowValue: any[] = [];
			const getExpanded = (oldValue: any, key: any) => {
				const included = defaultExpandAll || (treeExpandRowValue && treeExpandRowValue.indexOf(key) !== -1);
				return !!((oldValue && oldValue.expanded) || included);
			};
			// 合并 expanded 与 display，确保数据刷新后，状态不变
			keys.forEach((key) => {
				const oldValue = oldTreeData[key];
				const newValue = { ...nested[key] };
				newValue.expanded = getExpanded(oldValue, key);
				if (newValue.lazy) {
					const { loaded = false, loading = false } = oldValue || {};
					newValue.loaded = !!loaded;
					newValue.loading = !!loading;
					rootLazyRowValue.push(key);
				}
				newTreeData[key] = newValue;
			});
			// 根据懒加载数据更新 treeData
			const lazyKeys = Object.keys(normalizedLazyNode);
			if (treeLazy && lazyKeys.length && rootLazyRowValue.length) {
				lazyKeys.forEach((key) => {
					const oldValue = oldTreeData[key];
					const lazyNodeChildren = normalizedLazyNode[key].children;
					if (rootLazyRowValue.includes(key)) {
						// 懒加载的 root 节点，更新一下原有的数据，原来的 children 一定是空数组
						if (newTreeData[key].children.length !== 0) {
							throw new VcError('table', 'children需要为空数组');
						}
						newTreeData[key].children = lazyNodeChildren;
					} else {
						const { loaded = false, loading = false } = oldValue || {};
						newTreeData[key] = reactive({
							lazy: true,
							loaded: !!loaded,
							loading: !!loading,
							expanded: getExpanded(oldValue, key),
							children: lazyNodeChildren,
							level: ''
						});
					}
				});
			}
		}
		this.store.states.treeData = newTreeData;
		this.store.updateTableScrollY();
	}

	expand(ids: any[]) {
		this.store.states.treeExpandRowValue = ids;
		this.update();
	}

	toggle(row: any, expanded?: boolean) {
		this.store.checkRowKey();
		const { rowKey } = this.store.table.props;
		const { treeData } = this.store.states;

		const id = getRowIdentity(row, rowKey);
		const data = id && treeData[id];
		if (id && data && 'expanded' in data) {
			const oldExpanded = data.expanded;
			expanded = typeof expanded === 'undefined' ? !data.expanded : expanded;
			this.store.states.treeData[id].expanded = expanded;
			if (oldExpanded !== expanded) {
				this.store.table.emit('expand-change', row, expanded, this.getMaxLevel());
			}
			this.store.updateTableScrollY();
		}
	}

	loadOrToggle(row: any) {
		this.store.checkRowKey();
		const { rowKey } = this.store.table.props;
		const { treeLazy, treeData } = this.store.states;
		const id = getRowIdentity(row, rowKey);
		const data = treeData[id];
		if (treeLazy && data && 'loaded' in data && !data.loaded) {
			this.loadData(row, id, data);
		} else {
			this.toggle(row);
		}
	}

	loadData(row: any, key: any, treeNode: any) {
		this.store.checkRowKey();
		const { table } = this.store;
		const { rowKey } = table.props;
		const { treelazyNodeMap, treeData, treeChildrenColumnName, treeLazyColumnIdentifier } = this.store.states;

		if (table.props.loadExpand && !treeData[key].loaded) {
			this.store.states.treeData[key].loading = true;
			const promise = table.props.loadExpand(row, treeNode);
			const fn = (data: any) => {
				if (!Array.isArray(data)) {
					throw new VcError('table', 'data必须是数组');
				}
				this.store.states.treeData[key].loading = false;
				this.store.states.treeData[key].loaded = true;
				this.store.states.treeData[key].expanded = true;

				/**
				 * 处理tree中和返回的数据与首次相同的情况，
				 */
				walkTreeNode(
					data,
					(parent: any, _: any, level: number) => {
						const id = getRowIdentity(parent, rowKey);
						Object.defineProperty(parent, '__KEY__', {
							value: `${level}__${id}`,
							writable: false
						});
					},
					{
						childrenKey: treeChildrenColumnName,
						lazyKey: treeLazyColumnIdentifier,
						level: treeNode.level
					}
				);

				if (data.length) {
					this.store.states.treelazyNodeMap[key] = data;

					// 用新的treelazyNodeMap计算treeLazyData
					if (table.props.expandSelectable) {
						this.store.states.treeLazyData = Object.keys(treelazyNodeMap).reduce((pre, cur) => {
							return pre.concat(treelazyNodeMap[cur]);
						}, []);
					}
				}

				// 对异步过来的数据进行选择
				if (this.store.isSelected(row)) {
					data.forEach((i) => {
						this.store.toggleRowSelection(i);
					});
				}
				this.store.updateAllSelected();

				/**
				 * 计算最大的level, 有必要添加$nextTick
				 * TODO: 去除$nextTick, 期间会触发一次update
				 */
				nextTick(() => {
					table.emit('expand-change', row, true, this.getMaxLevel());
				});
			};

			if (promise && promise.then) {
				promise.then((data: any) => fn(data)).catch((e) => {
					throw new VcError('table', e);
				});
			} else if (Array.isArray(promise)) {
				fn(promise);
			}
		}
	}
}
