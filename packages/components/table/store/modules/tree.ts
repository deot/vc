import { computed, watch, toRaw } from 'vue';
import { isEmpty } from 'lodash-es';
import { getRowValue } from '../../utils';
import { VcError } from '../../../vc';
import type { Store } from '../store';

/**
 * 树节点的结构信息（仅记录可展开的节点）
 */
export interface TreeNodeInfo {
	// 层级，根为 0
	level: number;
	// 懒加载节点，尚未加载子行
	loadable: boolean;
}

/**
 * 树形列单元格的渲染信息，同时作为 loadExpand 的第二个参数
 */
export interface TreeNode {
	level: number;
	// 缩进（px）：level * indent
	indent: number;
	// 是否可展开（有子行，或是尚未加载的懒加载节点）
	expandable: boolean;
	expanded: boolean;
	loading: boolean;
}

type Normalized = {
	// 行值 -> 可展开节点
	nodes: Record<string, TreeNodeInfo>;
	// 全部行（含嵌套与懒加载得到的子行，不论展开与否）
	rows: any[];
};

/**
 * 树形数据：
 * 	- 结构（节点、全部行）由 data 与懒加载结果派生，深度读取 children，嵌套数据的原地增删也能感知；
 * 	- 展开 / 加载状态按行值记录在 store.states，与结构分离，数据刷新后自然保留；
 * 	- 可见行由 flatten 按展开状态铺平，交给 store.updateList 重建渲染块。
 */
export class Tree {
	store: Store;

	normalized = computed<Normalized>(() => {
		const { data, treeLazyChildren } = this.store.states;
		const { primaryKey, lazyTree } = this.store.table.props;
		if (!primaryKey) return { nodes: {}, rows: data };

		const { childrenKey, hasChildrenKey } = this.fields;
		const nodes: Record<string, TreeNodeInfo> = {};
		const rows: any[] = [];
		const walk = (source: any[], level: number) => {
			source.forEach((row) => {
				rows.push(row);
				const id = getRowValue(row, primaryKey);
				if (id == null) return;

				const loaded = treeLazyChildren[id];
				const children = loaded || row[childrenKey];
				const hasChildren = Array.isArray(children) && children.length > 0;
				const loadable = !hasChildren && !!lazyTree && !loaded && !!row[hasChildrenKey];
				// 行值须在整棵树中唯一：重复出现的可展开行值（如子行与祖先同值）只记录首次，避免无限递归
				if ((!hasChildren && !loadable) || nodes[id]) return;

				nodes[id] = { level, loadable };
				hasChildren && walk(children, level + 1);
			});
		};
		walk(data, 0);
		return { nodes, rows: isEmpty(nodes) ? data : rows };
	});

	// 最近一次重建渲染块所依据的结构，结构未变化时 watch 不再重复重建
	built: Normalized | null = null;

	// 最近一次铺平得到的可见行最大层级
	maxLevel = 0;

	constructor(store: Store) {
		this.store = store;

		// 数据数组不变时的原地增删（嵌套 children、懒加载结果）不经过 setData，在这里同步
		watch(this.normalized, (value) => {
			if (value === this.built) return;
			this.store.updateList();
			// 被移除的行移出选中项；reserveSelection 时保留，与 setData 一致
			this.store.states.reserveSelection || this.store.selection.clean();
			this.store.selection.updateAllSelected();
			this.store.scheduleLayout();
		});
	}

	get nodes() {
		return this.normalized.value.nodes;
	}

	get rows() {
		return this.normalized.value.rows;
	}

	get isTree() {
		return !isEmpty(this.nodes);
	}

	// tree-map 映射的字段名
	get fields() {
		const { treeMap } = this.store.table.props;
		return {
			childrenKey: treeMap.children || 'children',
			hasChildrenKey: treeMap.hasChildren || 'hasChildren'
		};
	}

	getKey(row: any) {
		return getRowValue(row, this.store.table.props.primaryKey);
	}

	// 子行：懒加载结果优先，其次为 children 字段
	getChildren(row: any, id: any): any[] {
		return this.store.states.treeLazyChildren[id] || row[this.fields.childrenKey] || [];
	}

	/**
	 * 节点是否展开：显式记录优先，否则取 defaultExpandAll；尚未加载的懒加载节点始终收起
	 * @param id 行值
	 * @returns 是否展开
	 */
	isExpanded(id: any) {
		const node = this.nodes[id];
		if (!node || node.loadable) return false;
		const { treeExpanded } = this.store.states;
		return id in treeExpanded ? treeExpanded[id] : !!this.store.table.props.defaultExpandAll;
	}

	/**
	 * 按展开状态把树形数据铺平为可见行，子行紧随父行
	 * @returns 可见行与对应的层级；非树形表格返回 null
	 */
	flatten() {
		const normalized = this.normalized.value;
		this.built = normalized;
		this.maxLevel = 0;
		if (isEmpty(normalized.nodes)) return null;

		const data: any[] = [];
		const levels: number[] = [];
		// 与结构计算一致：同一行值只展开首次出现的行
		const expanded = new Set<string>();
		const walk = (source: any[], level: number) => {
			source.forEach((row) => {
				data.push(row);
				levels.push(level);
				this.maxLevel = Math.max(this.maxLevel, level);

				const id = this.getKey(row);
				if (!this.isExpanded(id) || expanded.has(`${id}`)) return;
				expanded.add(`${id}`);
				walk(toRaw(this.getChildren(row, id)), level + 1);
			});
		};
		walk(toRaw(this.store.states.data), 0);
		return { data, levels };
	}

	/**
	 * 树形列单元格的渲染信息；在渲染中调用，展开、加载状态变化时随之更新
	 * @param row 行数据
	 * @param level 行所在层级
	 * @returns 缩进、展开与加载状态
	 */
	getTreeNode(row: any, level: number): TreeNode {
		const id = this.getKey(row);
		return {
			level,
			indent: level * this.store.table.props.indent,
			expandable: !!this.nodes[id],
			expanded: this.isExpanded(id),
			loading: !!this.store.states.treeLoading[id]
		};
	}

	/**
	 * 切换节点的展开状态；展开尚未加载的懒加载节点时先加载
	 * @param row 行数据
	 * @param expanded 指定展开与否，省略时切换
	 */
	toggle(row: any, expanded?: boolean) {
		const id = this.getKey(row);
		const node = id == null ? null : this.nodes[id];
		if (!node) return;

		const current = this.isExpanded(id);
		const value = typeof expanded === 'boolean' ? expanded : !current;
		if (value === current) return;
		if (value && node.loadable) {
			this.load(row, id, node);
			return;
		}

		this.store.states.treeExpanded[id] = value;
		this.store.updateList();
		this.store.scheduleLayout();
		this.store.table.emit('expand-change', row, value, this.maxLevel);
	}

	/**
	 * 设置展开的节点（expand-row-value），其余节点取 defaultExpandAll
	 * @param values 展开节点的行值
	 */
	reset(values: any[]) {
		this.store.states.treeExpanded = values.reduce((pre, value) => {
			pre[value] = true;
			return pre;
		}, {} as Record<string, boolean>);
		this.store.updateList();
	}

	/**
	 * 清理已不存在的行的展开 / 加载状态与懒加载结果
	 */
	prune() {
		const { treeExpanded, treeLoading, treeLazyChildren } = this.store.states;
		const maps = [treeExpanded, treeLoading, treeLazyChildren];
		if (maps.every(map => isEmpty(map))) return;

		const ids = new Set(this.rows.map(row => `${this.getKey(row)}`));
		maps.forEach((map) => {
			Object.keys(map).forEach(key => !ids.has(key) && delete map[key]);
		});
	}

	load(row: any, id: any, node: TreeNodeInfo) {
		const { store } = this;
		const { loadExpand, expandSelectable } = store.table.props;
		const { treeLoading } = store.states;
		// 加载中重复触发（如连续点击）时忽略
		if (typeof loadExpand !== 'function' || treeLoading[id]) return;

		treeLoading[id] = true;
		const done = (children: any) => {
			delete treeLoading[id];
			if (!Array.isArray(children)) {
				throw new VcError('table', 'loadExpand 需返回数组或 Promise<数组>');
			}
			// 等待期间该行已被移除（如数据已刷新）
			if (!this.nodes[id]) return;

			// 返回响应式数组时，之后对它的增删也会同步到表格
			store.states.treeLazyChildren[id] = children;
			store.states.treeExpanded[id] = true;

			// 父行已选中时，一并选中加载得到的子行
			if (expandSelectable && store.selection.isSelected(row)) {
				store.selection.add(children);
			}
			store.selection.updateAllSelected();

			store.updateList();
			store.scheduleLayout();
			store.table.emit('expand-change', row, true, this.maxLevel);
		};
		const fail = (e: any) => {
			delete treeLoading[id];
			throw new VcError('table', e);
		};

		let result: any;
		try {
			result = loadExpand(row, this.getTreeNode(row, node.level));
		} catch (e) {
			fail(e);
		}
		if (result && typeof result.then === 'function') {
			result.then(done, fail);
		} else {
			done(result);
		}
	}
}
