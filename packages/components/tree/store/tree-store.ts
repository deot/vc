import { toRaw } from 'vue';
import { isEqualWith, difference } from 'lodash-es';
import { hasOwn } from '@deot/helper-utils';
import type { Nullable } from '@deot/helper-shared';
import { TreeNode, getRawValue } from './tree-node';
import { KEY_NODE, KEY_VALUE } from './constant';

export class TreeStore {
	primaryKey: string = KEY_NODE;
	keyValue = KEY_VALUE;

	currentNode: Nullable<TreeNode> = null;
	currentNodeValue?: string | number;
	nodesMap: Record<string | number, TreeNode> = {};
	root: TreeNode;

	data: any;
	filterNode: any;

	checkedValues: (string | number)[] = [];
	expandedValues: (string | number)[] = [];

	lazy = false;
	checkStrictly = false;
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

	constructor(options: Partial<TreeStore>) {
		for (const option in options) {
			if (hasOwn(options, option)) {
				this[option] = options[option];
			}
		}

		this.primaryKey = this.keyValue.value || this.primaryKey;
		this.nodesMap = {};

		this.root = new TreeNode({
			store: this,
			states: {
				data: this.data
			}
		});
		// 不处理自动加载一次
		this._initDefaultCheckedNodes();
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

	filter(value: any) {
		const filterNode = this.filterNode;
		const lazy = this.lazy;
		const traverse = function (node: TreeNode) {
			const childNodes = node.childNodes;

			childNodes.forEach((child) => {
				child.states.visible = filterNode.call(child, value, child.states.data, child);

				traverse(child);
			});

			if (!node.states.visible && childNodes.length) {
				node.states.visible = childNodes.some(child => child.states.visible);
			}
			if (!value) return;

			if (node.states.visible && !node.states.isLeaf && !lazy) node.expand();
		};

		traverse(this.root);
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
		return this.nodesMap[key] || null;
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
			const node = nodesMap[id];
			if (!node) continue;

			const hasSelectedChildInSet = node.childNodes.some(child =>
				checkedSet.has(child.getter.value as string | number)
			);
			if (!hasSelectedChildInSet) {
				anchors.push(id);
			}
		}

		anchors.sort((a, b) => {
			const na = nodesMap[a];
			const nb = nodesMap[b];
			if (!na || !nb) return 0;
			return nb.states.level - na.states.level;
		});

		return anchors;
	}

	_initDefaultCheckedNodes() {
		const checkedValues = this.checkedValues || [];
		const nodesMap = this.nodesMap;

		if (this.checkStrictly) {
			checkedValues.forEach((id: string | number) => {
				const node = nodesMap[id];
				if (node) {
					node.setChecked(true, false);
				}
			});
			return;
		}

		const anchorIds = this._getCascadeCheckedAnchorIds(checkedValues);
		anchorIds.forEach((id) => {
			const node = nodesMap[id];
			if (node) {
				node.setChecked(true, true);
			}
		});
	}

	_initDefaultCheckedNode(node: TreeNode) {
		const checkedValues = this.checkedValues || [];

		const nodeValue = node.getter.value;
		if (checkedValues.indexOf(nodeValue) === -1) return;

		if (this.checkStrictly) {
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
			difference(this.checkedValues as any, newVal).forEach((key: any) => {
				this.nodesMap[key] && this.nodesMap[key].setChecked(false, !this.checkStrictly);
			});

			this.checkedValues = newVal;
			this._initDefaultCheckedNodes();
		}
	}

	registerNode(node: TreeNode) {
		const key = this.primaryKey;
		if (!key || !node || !toRaw(node.states).data) return;

		const nodeValue = getRawValue(node);
		if (nodeValue !== undefined) this.nodesMap[nodeValue] = node;
	}

	deregisterNode(node: TreeNode) {
		const key = this.primaryKey;
		if (!key || !node || !toRaw(node.states).data) return;

		node.childNodes.forEach((child) => {
			this.deregisterNode(child);
		});

		const nodeValue = getRawValue(node);
		delete this.nodesMap[nodeValue];
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
	 * @returns 勾选数据
	 */
	getCheckedState() {
		const key = this.primaryKey;
		const checkedNodes: TreeNode[] = [];
		const halfCheckedNodes: TreeNode[] = [];
		const traverse = (node: TreeNode) => {
			node.childNodes.forEach((child) => {
				child.states.checked && checkedNodes.push(child);
				child.states.indeterminate && halfCheckedNodes.push(child);
				traverse(child);
			});
		};
		traverse(this.root);
		return {
			checkedNodes,
			checkedValues: checkedNodes.map(node => node.states.data[key]),
			halfCheckedNodes,
			halfCheckedValues: halfCheckedNodes.map(node => node.states.data[key])
		};
	}

	getCheckedValues(leafOnly = false) {
		return this.getCheckedNodes(leafOnly).map(node => node.states.data[this.primaryKey]);
	}

	getHalfCheckedNodes() {
		const nodesData: TreeNode[] = [];
		const traverse = function (node: TreeNode) {
			const childNodes = node.childNodes;

			childNodes.forEach((child) => {
				if (child.states.indeterminate) {
					nodesData.push(child);
				}

				traverse(child);
			});
		};

		traverse(this.root);

		return nodesData;
	}

	getHalfCheckedValues() {
		return this.getHalfCheckedNodes().map(node => node.states.data[this.primaryKey]);
	}

	_getAllNodes() {
		const allNodes: TreeNode[] = [];
		const nodesMap = this.nodesMap;
		for (const nodeKey in nodesMap) {
			if (hasOwn(nodesMap, nodeKey)) {
				allNodes.push(nodesMap[nodeKey]);
			}
		}

		return allNodes;
	}

	updateChildren(key: string, data: any[]) {
		const node = this.nodesMap[key];
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

	_setCheckedValues(key: string | number, leafOnly = false, checkedValues: Record<string | number, boolean>) {
		const allNodes = this._getAllNodes().sort((a, b) => b.states.level - a.states.level);
		const cache = Object.create(null);
		const keys = Object.keys(checkedValues);
		allNodes.forEach(node => node.setChecked(false, false));
		for (let i = 0, j = allNodes.length; i < j; i++) {
			const node = allNodes[i];
			const nodeKey = node.states.data[key].toString();
			const checked = keys.indexOf(nodeKey) > -1;
			if (!checked) {
				if (node.states.checked && !cache[nodeKey]) {
					node.setChecked(false, false);
				}
			} else {
				let parent = node.parentNode;
				while (parent && parent.states.level > 0) {
					cache[parent.states.data[key]] = true;
					parent = parent.parentNode;
				}
				if (node.states.isLeaf || this.checkStrictly) {
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
		const checkedMap: Record<string | number, boolean> = {};
		array.forEach((item) => {
			checkedMap[(item || {})[key]] = true;
		});

		this._setCheckedValues(key, leafOnly, checkedMap);
	}

	setExpandedValues(values: (string | number)[]) {
		values = values || [];
		this.expandedValues = values;

		values.forEach((v) => {
			const node = this.getNode(v);
			if (node) node.expand(this.autoExpandParent);
		});
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
		const currNode = this.nodesMap[key];
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
