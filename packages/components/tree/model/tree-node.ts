import { reactive } from 'vue';
import { hasOwn } from '@deot/helper-utils';
import type { Nullable } from '@deot/helper-shared';
import type { TreeStore } from './tree-store';

import { KEY_NODE, KEY_VALUE } from './constant';

export const markNodeData = (node: TreeNode, data?: object) => {
	if (!data || data[KEY_NODE]) return;
	Object.defineProperty(data, KEY_NODE, {
		value: node.id,
		enumerable: false,
		configurable: false,
		writable: false
	});
};

export const getChildState = (node: TreeNode[]) => {
	let all = true;
	let none = true;
	let allWithoutDisable = true;
	for (let i = 0, j = node.length; i < j; i++) {
		const n = node[i];
		if (n.checked !== true || n.indeterminate) {
			all = false;
			if (!n.disabled) {
				allWithoutDisable = false;
			}
		}
		if (n.checked !== false || n.indeterminate) {
			none = false;
		}
	}

	return { all, none, allWithoutDisable, half: !all && !none };
};

const reInitChecked = (node: TreeNode) => {
	if (node.childNodes.length === 0) return;

	const { all, none, half } = getChildState(node.childNodes);
	if (all) {
		node.checked = true;
		node.indeterminate = false;
	} else if (half) {
		node.checked = false;
		node.indeterminate = true;
	} else if (none) {
		node.checked = false;
		node.indeterminate = false;
	}

	const parent = node.parent;
	if (!parent || parent.level === 0) return;

	if (!node.store.checkStrictly) {
		reInitChecked(parent);
	}
};

const getPropertyFromData = (node: TreeNode, prop: string) => {
	const keyValue = node.store.keyValue;
	const data = node.data || {};
	const config = keyValue[prop];

	if (typeof config === 'function') {
		return config(data, node);
	} else if (typeof config === 'string') {
		return data[config];
	} else if (typeof config === 'undefined') {
		const dataProp = data[prop];
		return dataProp === undefined ? '' : dataProp;
	}
};

let nodeIdSeed = 0;

export class TreeNode {
	id = nodeIdSeed++;
	checked = false;
	indeterminate = false;
	expanded = false;
	visible = true;
	isCurrent = false;
	isLeaf = false;
	isLeafByUser = false;
	level = 0;

	parent: Nullable<TreeNode> = null;

	data!: object;
	store!: TreeStore;

	loaded: boolean;
	childNodes: TreeNode[];
	loading: boolean;

	constructor(options: Partial<TreeNode>) {
		for (const name in options) {
			if (hasOwn(options, name)) {
				this[name] = options[name];
			}
		}
		const { store } = this;
		const { keyValue } = store;

		this.loaded = !!(this.data[keyValue.children]);
		this.childNodes = [];
		this.loading = false;

		if (this.parent) {
			this.level = this.parent.level + 1;
		}

		if (!store) {
			throw new Error('[Node]store is required!');
		}
		store.registerNode(this);

		if (keyValue && typeof keyValue.isLeaf !== 'undefined') {
			const isLeaf = getPropertyFromData(this, keyValue.isLeaf);
			if (typeof isLeaf === 'boolean') {
				this.isLeafByUser = isLeaf;
			}
		}

		if (this.data) {
			this.setData(this.data);
			if (store.defaultExpandAll && this.data[keyValue.children]) {
				this.expanded = true;
			}
		}

		// 自动加载
		// if (this.level > 0 && store.lazy && store.defaultExpandAll) {
		// 	this.expand();
		// }

		if (!Array.isArray(this.data)) {
			markNodeData(this, this.data);
		}
		if (!this.data) return;
		const expandedValues = store.expandedValues;
		const key = store.primaryKey;
		const value = this.data[key];
		if (key && expandedValues && expandedValues.indexOf(value) !== -1) {
			this.expand(store.autoExpandParent);
		}

		if (key && store.currentNodeValue !== undefined && value === store.currentNodeValue) {
			store.currentNode = this;
			store.currentNode.isCurrent = true;
		}

		if (store.lazy) {
			store._initDefaultCheckedNode(this);
		}

		this.updateLeafState();
	}

	get label() {
		return getPropertyFromData(this, 'label');
	}

	get value() {
		if (this.data) return this.data[this.store.primaryKey];
		return null;
	}

	get disabled() {
		return getPropertyFromData(this, 'disabled');
	}

	get nextSibling() {
		const parent = this.parent;
		if (parent) {
			const index = parent.childNodes.indexOf(this);
			if (index > -1) {
				return parent.childNodes[index + 1];
			}
		}
		return null;
	}

	get previousSibling() {
		const parent = this.parent;
		if (parent) {
			const index = parent.childNodes.indexOf(this);
			if (index > -1) {
				return index > 0 ? parent.childNodes[index - 1] : null;
			}
		}
		return null;
	}

	setData(data: object) {
		if (!Array.isArray(data)) {
			markNodeData(this, data);
		}

		this.data = data;
		this.childNodes = [];

		let children: any[];
		if (this.level === 0 && this.data instanceof Array) {
			children = this.data;
		} else {
			children = getPropertyFromData(this, 'children') || [];
		}

		for (let i = 0, j = children.length; i < j; i++) {
			this.insertChild({ data: children[i] });
		}
	}

	contains(target: TreeNode, deep = true) {
		const walk = function (parent: TreeNode) {
			const children = parent.childNodes || [];
			let result = false;
			for (let i = 0, j = children.length; i < j; i++) {
				const child = children[i];
				if (child === target || (deep && walk(child))) {
					result = true;
					break;
				}
			}
			return result;
		};

		return walk(this);
	}

	remove() {
		const parent = this.parent;
		if (parent) {
			parent.removeChild(this);
		}
	}

	insertChild(child?: Partial<TreeNode>, index?: number, batch?: any) {
		if (!child) throw new Error('insertChild error: child is required.');

		if (!(child instanceof TreeNode)) {
			if (!batch) {
				const children = this.getChildren(true);
				if (children.indexOf(child.data) === -1) {
					if (typeof index === 'undefined' || index < 0) {
						children.push(child.data);
					} else {
						children.splice(index, 0, child.data);
					}
				}
			}
			Object.assign(child, {
				parent: this,
				store: this.store
			});
			child = reactive(new TreeNode(child));
		}

		child.level = this.level + 1;

		if (typeof index === 'undefined' || index < 0) {
			this.childNodes.push(child as TreeNode);
		} else {
			this.childNodes.splice(index, 0, child as TreeNode);
		}

		this.updateLeafState();
	}

	insertBefore(child: Partial<TreeNode>, ref?: TreeNode) {
		let index = -1;
		if (ref) {
			index = this.childNodes.indexOf(ref);
		}
		this.insertChild(child, index);
	}

	insertAfter(child: Partial<TreeNode>, ref?: TreeNode) {
		let index = -1;
		if (ref) {
			index = this.childNodes.indexOf(ref);
			if (index !== -1) index += 1;
		}
		this.insertChild(child, index);
	}

	removeChild(child: TreeNode) {
		const children = this.getChildren() || [];
		const dataIndex = children.indexOf(child.data);
		if (dataIndex > -1) {
			children.splice(dataIndex, 1);
		}

		const index = this.childNodes.indexOf(child);

		if (index > -1) {
			this.store && this.store.deregisterNode(child);
			child.parent = null;
			this.childNodes.splice(index, 1);
		}

		this.updateLeafState();
	}

	removeChildByData(data: object) {
		let targetNode: Nullable<TreeNode> = null;

		for (let i = 0; i < this.childNodes.length; i++) {
			if (this.childNodes[i].data === data) {
				targetNode = this.childNodes[i];
				break;
			}
		}

		if (targetNode) {
			this.removeChild(targetNode);
		}
	}

	async expand(expandParent?: boolean) {
		const done = () => {
			if (expandParent) {
				let parent = this.parent;
				while (parent && parent.level > 0) {
					parent.expanded = true;
					parent = parent.parent;
				}
			}
			this.expanded = true;
		};

		if (this.shouldLoadData()) {
			const data: any = await this.loadData();
			if (data instanceof Array) {
				if (this.checked) {
					this.setChecked(true, true);
				} else if (!this.store.checkStrictly) {
					reInitChecked(this);
				}
				done();
			}
		} else {
			done();
		}
	}

	doCreateChildren(array: any[], defaultProps = {}) {
		array.forEach((item) => {
			this.insertChild({ data: item, ...defaultProps }, undefined, true);
		});
	}

	collapse() {
		this.expanded = false;
	}

	shouldLoadData() {
		return this.store.lazy
			&& this.store.loadData
			&& !this.loaded;
	}

	updateLeafState() {
		if (this.store.lazy
			&& !this.loaded
			&& typeof this.isLeafByUser !== 'undefined'
		) {
			this.isLeaf = this.isLeafByUser;
			return;
		}
		const childNodes = this.childNodes;
		if (!this.store.lazy || (this.store.lazy && this.loaded)) {
			this.isLeaf = !childNodes || childNodes.length === 0;
			return;
		}
		this.isLeaf = false;
	}

	async setChecked(value: boolean | string, deep?: boolean, recursion?: boolean, passValue?: boolean) {
		this.indeterminate = value === 'half';
		this.checked = value === true;

		if (this.store.checkStrictly) return;

		if (!(this.shouldLoadData() && !this.store.checkDescendants)) {
			const { all, allWithoutDisable } = getChildState(this.childNodes);

			if (!this.isLeaf && (!all && allWithoutDisable)) {
				this.checked = false;
				value = false;
			}

			const handleDescendants = () => {
				if (deep) {
					const childNodes = this.childNodes;
					for (let i = 0, j = childNodes.length; i < j; i++) {
						const child = childNodes[i];
						passValue = passValue || value !== false;
						const isCheck = child.disabled ? child.checked : passValue;
						child.setChecked(isCheck, deep, true, passValue);
					}
					const { half, all: $all } = getChildState(childNodes);
					if (!$all) {
						this.checked = $all;
						this.indeterminate = half;
					}
				}
			};

			if (this.shouldLoadData()) {
				// Only work on lazy load data.
				await this.loadData({ checked: value !== false });
				handleDescendants();
				reInitChecked(this);
				return;
			} else {
				handleDescendants();
			}
		}

		const parent = this.parent;
		if (!parent || parent.level === 0) return;

		if (!recursion) {
			reInitChecked(parent);
		}
	}

	getChildren(forceInit = false) { // this is data
		if (this.level === 0) return this.data;
		const data = this.data;
		if (!data) return null;

		const children = this.store.keyValue?.children || KEY_VALUE.children;
		if (data[children] === undefined) {
			data[children] = null;
		}

		if (forceInit && !data[children]) {
			data[children] = [];
		}

		return data[children];
	}

	updateChildren() {
		const newData = this.getChildren() || [];
		const oldData = this.childNodes.map(node => node.data);

		const newDataMap = {};
		const newNodes: any[] = [];

		newData.forEach((item: any, index: number) => {
			if (item[KEY_NODE]) {
				newDataMap[item[KEY_NODE]] = { index, data: item };
			} else {
				newNodes.push({ index, data: item });
			}
		});

		if (!this.store.lazy) {
			oldData.forEach((item) => {
				if (item && !newDataMap[item[KEY_NODE]]) this.removeChildByData(item);
			});
		}

		newNodes.forEach(({ index, data }) => {
			this.insertChild({ data }, index);
		});

		this.updateLeafState();
	}

	async loadData(defaultProps = {}) {
		if (
			this.store.lazy
			&& this.store.loadData
			&& !this.loaded
			&& (!this.loading || Object.keys(defaultProps).length)
		) {
			this.loading = true;
			const children: any[] = await this.store.loadData(this);
			this.loaded = true;
			this.loading = false;
			this.childNodes = [];

			this.doCreateChildren(children, defaultProps);

			this.updateLeafState();

			return children;
		}
	}
}
