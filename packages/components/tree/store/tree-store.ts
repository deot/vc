import { toRaw } from 'vue';
import { isEqualWith, difference } from 'lodash-es';
import { hasOwn } from '@deot/helper-utils';
import type { Nullable } from '@deot/helper-shared';
import { TreeNode, getRawValue, syncCheckFromChildren } from './tree-node';
import { KEY_NODE, KEY_VALUE } from './constant';
import type { TreeCheckStrategy } from '../types';

export class TreeStore {
	primaryKey: string = KEY_NODE;
	keyValue = KEY_VALUE;

	currentNode: Nullable<TreeNode> = null;
	currentNodeValue?: string | number;
	// 值 -> 节点，按 === 查找（字符串与数字不同，需要时由 numerable 转换）
	nodesMap = new Map<string | number, TreeNode>();
	root: TreeNode;

	data: any;
	filterNode: any;

	checkedValues: (string | number)[] = [];
	expandedValues: (string | number)[] = [];

	lazy = false;
	// 勾选联动与回填方式，见 getCheckedState
	checkStrategy: TreeCheckStrategy = 'all';
	autoExpandParent = true;
	checkDescendants = false;
	defaultExpandAll = false;

	loadData: any;

	// 节点的勾选 / 半选状态变化：同一轮写入（如一次勾选引起的上下联动）结束后，每个变了的节点发出一次
	onCheckChange?: (node: TreeNode) => void;
	// 本轮写入前的状态
	private pendingChecks = new Map<TreeNode, [boolean, boolean]>();
	// expandedValues 的查找表，随数组引用重建
	private expandedSet?: [(string | number)[], Set<string | number>];
	// 开始筛选时已展开节点的值，清空关键词时据此恢复，见 filter
	private expandedBeforeFilter?: Set<string | number>;
	// 批量写入勾选期间推迟重算的节点，按层存放，见 batchCheck
	private deferredChecks?: Map<number, Set<TreeNode>>;

	constructor(options: Partial<TreeStore>) {
		for (const option in options) {
			if (hasOwn(options, option)) {
				this[option] = options[option];
			}
		}

		this.primaryKey = this.keyValue.value || this.primaryKey;
		this.nodesMap = new Map();

		this.root = new TreeNode({
			store: this,
			states: {
				data: this.data
			}
		});
		// 不处理自动加载一次
		this._initDefaultCheckedNodes();
	}

	// 父子独立勾选
	get strict() {
		return this.checkStrategy === 'strict';
	}

	/**
	 * 节点的勾选状态即将写入：记下写入前的状态，本轮写入结束后（微任务）比较，变了的发出 onCheckChange
	 * @param node ~
	 */
	markCheckChange(node: TreeNode) {
		if (!this.onCheckChange || this.pendingChecks.has(node)) return;
		this.pendingChecks.size === 0 && queueMicrotask(() => this.flushCheckChanges());
		this.pendingChecks.set(node, [node.states.checked, node.states.indeterminate]);
	}

	/**
	 * 批量写入勾选：逐个调用 fn 写入节点，期间父节点的重算（reInitChecked）推迟，按层从深到浅、每个节点只算一次
	 * 	- 逐个写入时每个节点都会让父节点重新统计一遍全部兄弟（N 个叶子 × 兄弟数）
	 * 	- 与逐个写入结果一致：写入一个节点只读写它自己的子树，写入前先算完不浅于它的待算节点，它读到的与逐个写入时相同；每个待算节点在子节点都定下来后算，结果也相同
	 * @param nodes 要写入的节点
	 * @param fn 写入
	 */
	batchCheck(nodes: TreeNode[], fn: (node: TreeNode) => void) {
		// 嵌套调用时沿用外层的登记，由外层收尾
		const outer = !!this.deferredChecks;
		outer || (this.deferredChecks = new Map());
		try {
			nodes.forEach((node) => {
				this.flushDeferredChecks(toRaw(node.states).level);
				fn(node);
			});
			outer || this.flushDeferredChecks(1);
		} finally {
			outer || (this.deferredChecks = undefined);
		}
	}

	/**
	 * 批量写入期间登记要重算的节点，见 batchCheck
	 * @param node ~
	 * @returns 是否已推迟
	 */
	deferCheck(node: TreeNode) {
		if (!this.deferredChecks) return false;
		// 逐个写入时此刻会依次写入它和各级祖先：按同样的顺序记下写入前的状态，check-change 的顺序不变
		if (this.onCheckChange) {
			let current: TreeNode | null = node;
			for (; current && toRaw(current.states).level > 0; current = this.strict ? null : current.parentNode) {
				this.markCheckChange(current);
			}
		}
		this.enqueueCheck(node);
		return true;
	}

	private enqueueCheck(node: TreeNode) {
		const level = toRaw(node.states).level;
		let nodes = this.deferredChecks!.get(level);
		nodes || this.deferredChecks!.set(level, (nodes = new Set()));
		nodes.add(node);
	}

	/**
	 * 从深到浅重算层级不小于 minLevel 的待算节点，父节点登记到上一层，同在范围内的随后算
	 * @param minLevel ~
	 */
	private flushDeferredChecks(minLevel: number) {
		const deferred = this.deferredChecks!;
		if (!deferred.size) return;
		const levels = [...deferred.keys()].filter(level => level >= minLevel).sort((a, b) => b - a);
		if (!levels.length) return;
		for (let level = levels[0]; level >= minLevel; level--) {
			const nodes = deferred.get(level);
			if (!nodes) continue;
			deferred.delete(level);
			nodes.forEach((node) => {
				syncCheckFromChildren(node) && this.enqueueCheck(node.parentNode!);
			});
		}
	}

	flushCheckChanges() {
		const pending = this.pendingChecks;
		this.pendingChecks = new Map();
		pending.forEach(([checked, indeterminate], node) => {
			(node.states.checked !== checked || node.states.indeterminate !== indeterminate) && this.onCheckChange?.(node);
		});
	}

	hasExpandedValue(value: string | number) {
		const values = this.expandedValues;
		if (!values || !values.length) return false;
		if (this.expandedSet?.[0] !== values) {
			this.expandedSet = [values, new Set(values)];
		}
		return this.expandedSet[1].has(value);
	}

	/**
	 * 筛选节点：有关键词时展开命中节点的祖先；清空关键词时收起筛选期间展开的节点，恢复筛选前的展开状态
	 * 	- 在事件处理中调用：遍历原始数组与原始状态，值变化时才经代理写入
	 * @param value 关键词
	 */
	filter(value: any) {
		const filterNode = this.filterNode;
		const lazy = this.lazy;
		if (value && !this.expandedBeforeFilter) {
			const expanded = new Set<string | number>();
			this._walkRaw(node => toRaw(node.states).expanded && expanded.add(getRawValue(node)));
			this.expandedBeforeFilter = expanded;
		}

		const traverse = function (node: TreeNode) {
			const childNodes = toRaw(node.childNodes);
			const states = toRaw(node.states);

			for (let i = 0, j = childNodes.length; i < j; i++) {
				const child = childNodes[i];
				const visible = !!filterNode.call(child, value, toRaw(child.states).data, child);
				toRaw(child.states).visible !== visible && (child.states.visible = visible);

				traverse(child);
			}

			if (!states.visible && childNodes.length && childNodes.some(child => toRaw(child.states).visible)) {
				node.states.visible = true;
			}
			if (!value) return;

			if (states.visible && !states.isLeaf && !states.expanded && !lazy) node.states.expanded = true;
		};

		traverse(this.root);

		if (!value && this.expandedBeforeFilter) {
			const expanded = this.expandedBeforeFilter;
			this.expandedBeforeFilter = undefined;
			this._walkRaw(node => toRaw(node.states).expanded && !expanded.has(getRawValue(node)) && node.collapse());
		}
	}

	_walkRaw(fn: (node: TreeNode) => void) {
		const walk = (node: TreeNode) => {
			const childNodes = toRaw(node.childNodes);
			for (let i = 0, j = childNodes.length; i < j; i++) {
				fn(childNodes[i]);
				walk(childNodes[i]);
			}
		};
		walk(this.root);
	}

	setData(newVal: object) {
		const instanceChanged = newVal !== this.root.states.data;
		if (instanceChanged) {
			this.root.setData(newVal);
			this._initDefaultCheckedNodes();
		} else {
			this.root.updateChildren();
		}
	}

	getNode(v: object | string | number | TreeNode): Nullable<TreeNode> {
		if (v instanceof TreeNode) return v;
		const key = typeof v !== 'object' ? v : v[this.primaryKey];
		return this.nodesMap.get(key) || null;
	}

	insertBefore(data: object, refData: object) {
		const refNode = this.getNode(refData);
		refNode?.parentNode?.insertBefore?.({ data }, refNode);
	}

	insertAfter(data: object, refData: object) {
		const refNode = this.getNode(refData);
		refNode?.parentNode?.insertAfter?.({ data }, refNode);
	}

	remove(data: object) {
		const node = this.getNode(data);

		if (node && node.parentNode) {
			if (node === this.currentNode) {
				this.currentNode = null;
			}
			node.parentNode.removeChild(node);
		}
	}

	append(data: object, parentData: object) {
		const parentNode = parentData ? this.getNode(parentData) : this.root;

		if (parentNode) {
			parentNode.insertChild({ data });
		}
	}

	/**
	 * 级联非 strict：仅对「选中集合里的最深节点」做 setChecked(true, deep)，
	 * 避免对祖先逐个 deep 勾选把未出现在 checkedValues 里的兄弟子树再次全选。
	 * @param checkedValues ~
	 * @returns ~
	 */
	_getCascadeCheckedAnchorIds(checkedValues: (string | number)[]): (string | number)[] {
		const checkedSet = new Set(checkedValues);
		const nodesMap = this.nodesMap;
		const anchors: (string | number)[] = [];

		for (const id of checkedValues) {
			const node = nodesMap.get(id);
			if (!node) continue;

			const hasSelectedChildInSet = node.childNodes.some(child =>
				checkedSet.has(child.getter.value as string | number)
			);
			if (!hasSelectedChildInSet) {
				anchors.push(id);
			}
		}

		anchors.sort((a, b) => {
			const na = nodesMap.get(a);
			const nb = nodesMap.get(b);
			if (!na || !nb) return 0;
			return nb.states.level - na.states.level;
		});

		return anchors;
	}

	_initDefaultCheckedNodes() {
		const checkedValues = this.checkedValues || [];
		const nodesMap = this.nodesMap;

		if (this.strict) {
			checkedValues.forEach((id: string | number) => {
				const node = nodesMap.get(id);
				if (node) {
					node.setChecked(true, false);
				}
			});
			return;
		}

		const anchors = this._getCascadeCheckedAnchorIds(checkedValues).map(id => nodesMap.get(id)!).filter(Boolean);
		this.batchCheck(anchors, node => node.setChecked(true, true));
	}

	_initDefaultCheckedNode(node: TreeNode) {
		const checkedValues = this.checkedValues || [];

		const nodeValue = node.getter.value;
		if (checkedValues.indexOf(nodeValue) === -1) return;

		if (this.strict) {
			node.setChecked(true, false);
			return;
		}

		const checkedSet = new Set(checkedValues);
		const hasSelectedChildInSet = node.childNodes.some(child =>
			checkedSet.has(child.getter.value as string | number)
		);
		if (!hasSelectedChildInSet) {
			node.setChecked(true, true);
		}
	}

	setCheckedValues(newVal: any) {
		if (!isEqualWith(newVal, this.checkedValues)) {
			// 额外处理, 移除checkbox
			const removed = difference(this.checkedValues as any, newVal).map((key: any) => this.nodesMap.get(key)!).filter(Boolean);
			this.batchCheck(removed, node => node.setChecked(false, !this.strict));

			this.checkedValues = newVal;
			this._initDefaultCheckedNodes();
		}
	}

	registerNode(node: TreeNode) {
		const key = this.primaryKey;
		if (!key || !node || !toRaw(node.states).data) return;

		const nodeValue = getRawValue(node);
		if (nodeValue !== undefined) this.nodesMap.set(nodeValue, node);
	}

	deregisterNode(node: TreeNode) {
		const key = this.primaryKey;
		if (!key || !node || !toRaw(node.states).data) return;

		node.childNodes.forEach((child) => {
			this.deregisterNode(child);
		});

		const nodeValue = getRawValue(node);
		this.nodesMap.delete(nodeValue);
	}

	getCheckedNodes(leafOnly = false, includeHalfChecked = false) {
		const checkedNodes: TreeNode[] = [];
		const traverse = function (node: TreeNode) {
			const childNodes = node.childNodes;

			childNodes.forEach((child: TreeNode) => {
				if (
					(child.states.checked || (includeHalfChecked && child.states.indeterminate))
					&& (!leafOnly || (leafOnly && child.states.isLeaf))
				) {
					checkedNodes.push(child);
				}

				traverse(child);
			});
		};

		traverse(this.root);

		return checkedNodes;
	}

	/**
	 * 勾选与半选的节点及其值（同步 v-model 用），遍历一次
	 * 	- 勾选的节点按 checkStrategy 回填：strict / all 全部；parent 父节点未勾选的；child 没有勾选的子节点的
	 * 	- 在事件处理中调用，不需要依赖追踪：遍历原始数组与原始状态，不经过响应式代理（5 万节点每次勾选约 30 → 19ms）
	 * @returns 勾选数据
	 */
	getCheckedState() {
		const key = this.primaryKey;
		const strategy = this.checkStrategy;
		const checkedNodes: TreeNode[] = [];
		const halfCheckedNodes: TreeNode[] = [];
		const hasCheckedChild = (node: TreeNode) => toRaw(node.childNodes).some(child => toRaw(child.states).checked);
		const traverse = (node: TreeNode, parentChecked: boolean) => {
			const children = toRaw(node.childNodes);
			for (let i = 0, j = children.length; i < j; i++) {
				const child = children[i];
				const states = toRaw(child.states);
				states.checked
				&& (strategy === 'parent' ? !parentChecked : strategy !== 'child' || !hasCheckedChild(child))
				&& checkedNodes.push(child);
				states.indeterminate && halfCheckedNodes.push(child);
				traverse(child, states.checked);
			}
		};
		traverse(this.root, false);
		const toValue = (node: TreeNode) => toRaw(node.states).data[key];
		return {
			checkedNodes,
			checkedValues: checkedNodes.map(toValue),
			halfCheckedNodes,
			halfCheckedValues: halfCheckedNodes.map(toValue)
		};
	}

	getCheckedValues(leafOnly = false) {
		return this.getCheckedNodes(leafOnly).map(node => node.states.data[this.primaryKey]);
	}

	getHalfCheckedNodes() {
		return this.getCheckedState().halfCheckedNodes;
	}

	getHalfCheckedValues() {
		return this.getHalfCheckedNodes().map(node => node.states.data[this.primaryKey]);
	}

	_getAllNodes() {
		return [...this.nodesMap.values()];
	}

	updateChildren(key: string, data: any[]) {
		const node = this.nodesMap.get(key);
		if (!node) return;
		const childNodes = node.childNodes;
		for (let i = childNodes.length - 1; i >= 0; i--) {
			const child = childNodes[i];
			this.remove(child.states.data);
		}
		for (let i = 0, j = data.length; i < j; i++) {
			const child = data[i];
			this.append(child, node.states.data);
		}
	}

	_setCheckedValues(key: string | number, leafOnly = false, checkedValues: Set<string | number>) {
		const allNodes = this._getAllNodes().sort((a, b) => b.states.level - a.states.level);
		const cache = new Set<string | number>();
		allNodes.forEach(node => node.setChecked(false, false));
		for (let i = 0, j = allNodes.length; i < j; i++) {
			const node = allNodes[i];
			const nodeKey = node.states.data[key];
			const checked = checkedValues.has(nodeKey);
			if (!checked) {
				if (node.states.checked && !cache.has(nodeKey)) {
					node.setChecked(false, false);
				}
			} else {
				let parent = node.parentNode;
				while (parent && parent.states.level > 0) {
					cache.add(parent.states.data[key]);
					parent = parent.parentNode;
				}
				if (node.states.isLeaf || this.strict) {
					node.setChecked(true, false);
				} else {
					node.setChecked(true, true);

					if (leafOnly) {
						node.setChecked(false, false);
						const traverse = function (node$: TreeNode) {
							const childNodes = node$.childNodes;
							childNodes.forEach((child) => {
								if (!child.states.isLeaf) {
									child.setChecked(false, false);
								}
								traverse(child);
							});
						};
						traverse(node);
					}
				}
			}
		}
	}

	setCheckedNodes(array: TreeNode[], leafOnly = false) {
		const key = this.primaryKey;
		this._setCheckedValues(key, leafOnly, new Set(array.map(item => (item || {})[key])));
	}

	setExpandedValues(values: (string | number)[]) {
		values = values || [];
		this.expandedValues = values;

		values.forEach((v) => {
			const node = this.getNode(v);
			if (node) this.expandNode(node);
		});
	}

	/**
	 * 按 expandedValues 展开节点（autoExpandParent 时连同祖先）
	 * 	- 不需要加载时同步写入，已展开的跳过：不像 expand 那样为每个值建一个 Promise
	 * @param node ~
	 */
	expandNode(node: TreeNode) {
		if (node.shouldLoadData()) {
			node.expand(this.autoExpandParent);
			return;
		}
		if (this.autoExpandParent) {
			for (let parent = node.parentNode; parent && toRaw(parent.states).level > 0; parent = parent.parentNode) {
				toRaw(parent.states).expanded || (parent.states.expanded = true);
			}
		}
		toRaw(node.states).expanded || (node.states.expanded = true);
	}

	setChecked(v: any, checked?: boolean, deep?: boolean) {
		const node = this.getNode(v);

		if (node) {
			node.setChecked(!!checked, deep);
		}
	}

	getCurrentNode() {
		return this.currentNode;
	}

	setCurrentNode(currentNode: TreeNode) {
		const prevCurrentNode = this.currentNode;
		if (prevCurrentNode) {
			prevCurrentNode.states.isCurrent = false;
		}
		this.currentNode = currentNode;
		this.currentNode.states.isCurrent = true;
	}

	setUserCurrentNode(node: TreeNode) {
		const key = node[this.primaryKey];
		const currNode = this.nodesMap.get(key)!;
		this.setCurrentNode(currNode);
	}

	setCurrentNodeByData(data?: object) {
		if (data === null || data === undefined) {
			if (this.currentNode) {
				this.currentNode.states.isCurrent = false;
				this.currentNode = null;
				return;
			}
		}
		const node = this.getNode(data!);
		if (node) {
			this.setCurrentNode(node);
		}
	}
}
