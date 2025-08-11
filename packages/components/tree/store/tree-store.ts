import { isEqualWith, difference } from 'lodash-es';
import { hasOwn } from '@deot/helper-utils';
import type { Nullable } from '@deot/helper-shared';
import { TreeNode } from './tree-node';
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

	_initDefaultCheckedNodes() {
		const checkedValues = this.checkedValues || [];
		const nodesMap = this.nodesMap;

		checkedValues.forEach((id: string | number) => {
			const node = nodesMap[id];

			if (node) {
				node.setChecked(true, !this.checkStrictly);
			}
		});
	}

	_initDefaultCheckedNode(node: TreeNode) {
		const checkedValues = this.checkedValues || [];

		const nodeValue = node.getter.value;
		if (checkedValues.indexOf(nodeValue) !== -1) {
			node.setChecked(true, !this.checkStrictly);
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
		if (!key || !node || !node.states.data) return;

		const nodeValue = node.getter.value;
		if (nodeValue !== undefined) this.nodesMap[nodeValue] = node;
	}

	deregisterNode(node: TreeNode) {
		const key = this.primaryKey;
		if (!key || !node || !node.states.data) return;

		node.childNodes.forEach((child) => {
			this.deregisterNode(child);
		});

		const nodeValue = node.getter.value;
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
