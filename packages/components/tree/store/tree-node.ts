import { reactive, computed } from 'vue';
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

export const getChildState = (nodes: TreeNode[]) => {
	let all = true;
	let none = true;
	let allWithoutDisable = true;
	for (let i = 0, j = nodes.length; i < j; i++) {
		const node = nodes[i];
		if (node.states.checked !== true || node.states.indeterminate) {
			all = false;
			if (!node.getter.disabled) {
				allWithoutDisable = false;
			}
		}
		if (node.states.checked !== false || node.states.indeterminate) {
			none = false;
		}
	}

	return { all, none, allWithoutDisable, half: !all && !none };
};

const reInitChecked = (node: TreeNode) => {
	if (node.childNodes.length === 0) return;

	const { all, none, half } = getChildState(node.childNodes);
	if (all) {
		node.states.checked = true;
		node.states.indeterminate = false;
	} else if (half) {
		node.states.checked = false;
		node.states.indeterminate = true;
	} else if (none) {
		node.states.checked = false;
		node.states.indeterminate = false;
	}

	const parent = node.parentNode;
	if (!parent || parent.states.level === 0) return;

	if (!node.store.checkStrictly) {
		reInitChecked(parent);
	}
};

const getPropertyFromData = (node: TreeNode, prop: string) => {
	const keyValue = node.store.keyValue;
	const data = node.states.data || {};
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

type Options = Omit<Partial<TreeNode>, 'states'> & {
	states?: Partial<TreeNode['states']>;
};
let nodeIdSeed = 0;

export class TreeNode {
	id = nodeIdSeed++;
	states = reactive({
		checked: false,
		indeterminate: false,
		expanded: false,
		visible: true,
		isCurrent: false,
		isLeaf: false,
		isLeafByUser: false,
		loading: false,
		level: 0,
		loaded: false,
		data: null as any
	});

	getter = reactive({
		label: computed(() => getPropertyFromData(this, 'label')),
		value: computed(() => getPropertyFromData(this, 'value')),
		disabled: computed(() => getPropertyFromData(this, 'disabled')),
	});

	childNodes: TreeNode[] = reactive([]);

	store!: TreeStore;
	parentNode: Nullable<TreeNode> = null;

	constructor(options: Options) {
		for (const name in options) {
			if (hasOwn(options, name)) {
				if (name === 'states') {
					Object.assign(this.states, options[name]);
				} else {
					this[name] = options[name];
				}
			}
		}
		const store = this.store;
		const { keyValue } = store;

		this.states.loaded = !!(this.states.data[keyValue.children]);
		this.states.loading = false;

		if (this.parentNode) {
			this.states.level = this.parentNode.states.level + 1;
		}

		if (!store) {
			throw new Error('[Node]store is required!');
		}
		store.registerNode(this);

		if (keyValue && typeof keyValue.isLeaf !== 'undefined') {
			const isLeaf = getPropertyFromData(this, keyValue.isLeaf);
			if (typeof isLeaf === 'boolean') {
				this.states.isLeafByUser = isLeaf;
			}
		}

		if (this.states.data) {
			this.setData(this.states.data);
			if (store.defaultExpandAll && this.states.data[keyValue.children]) {
				this.states.expanded = true;
			}
		}

		// 自动加载
		// if (this.states.level > 0 && store.lazy && store.defaultExpandAll) {
		// 	this.expand();
		// }

		if (!Array.isArray(this.states.data)) {
			markNodeData(this, this.states.data);
		}
		if (!this.states.data) return;
		const expandedValues = store.expandedValues;
		const key = store.primaryKey;
		const value = this.states.data[key];
		if (key && expandedValues && expandedValues.indexOf(value) !== -1) {
			this.expand(store.autoExpandParent);
		}

		if (key && store.currentNodeValue !== undefined && value === store.currentNodeValue) {
			store.currentNode = this;
			store.currentNode.states.isCurrent = true;
		}

		if (store.lazy) {
			store._initDefaultCheckedNode(this);
		}

		this.updateLeafState();
	}

	getNextSiblingNode() {
		const parent = this.parentNode;
		if (parent) {
			const index = parent.childNodes.indexOf(this);
			if (index > -1) {
				return parent.childNodes[index + 1];
			}
		}
		return null;
	}

	getPreviousSiblingNode() {
		const parent = this.parentNode;
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

		this.states.data = data;
		this.childNodes.splice(0, this.childNodes.length - 1);

		let children: any[];
		if (this.states.level === 0 && this.states.data instanceof Array) {
			children = this.states.data;
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
		const parent = this.parentNode;
		if (parent) {
			parent.removeChild(this);
		}
	}

	insertChild(states: Partial<TreeNode['states']>, index?: number, batch?: any) {
		if (!states) throw new Error('insertChild error: states is required.');

		if (!batch) {
			const children = this.getChildren(true);
			if (children?.indexOf(states.data) === -1) {
				if (typeof index === 'undefined' || index < 0) {
					children.push(states.data);
				} else {
					children.splice(index, 0, states.data);
				}
			}
		}
		const child = new TreeNode({
			parentNode: this,
			store: this.store,
			states: states as any
		});

		child.states.level = this.states.level + 1;

		if (typeof index === 'undefined' || index < 0) {
			this.childNodes.push(child as TreeNode);
		} else {
			this.childNodes.splice(index, 0, child as TreeNode);
		}

		this.updateLeafState();

		return child;
	}

	insertBefore(states: Partial<TreeNode['states']>, ref?: TreeNode) {
		let index = -1;
		if (ref) {
			index = this.childNodes.indexOf(ref);
		}
		return this.insertChild(states, index);
	}

	insertAfter(states: Partial<TreeNode['states']>, ref?: TreeNode) {
		let index = -1;
		if (ref) {
			index = this.childNodes.indexOf(ref);
			if (index !== -1) index += 1;
		}
		return this.insertChild(states, index);
	}

	removeChild(child: TreeNode) {
		const children = this.getChildren() || [];
		const dataIndex = children.indexOf(child.states.data);
		if (dataIndex > -1) {
			children.splice(dataIndex, 1);
		}

		const index = this.childNodes.indexOf(child);

		if (index > -1) {
			this.store && this.store.deregisterNode(child);
			child.parentNode = null;
			this.childNodes.splice(index, 1);
		}

		this.updateLeafState();
	}

	removeChildByData(data: object) {
		let targetNode: Nullable<TreeNode> = null;

		for (let i = 0; i < this.childNodes.length; i++) {
			if (this.childNodes[i].states.data === data) {
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
				let parent = this.parentNode;
				while (parent && parent.states.level > 0) {
					parent.states.expanded = true;
					parent = parent.parentNode;
				}
			}
			this.states.expanded = true;
		};

		if (this.shouldLoadData()) {
			const data: any = await this.loadData();
			if (data instanceof Array) {
				if (this.states.checked) {
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
		this.states.expanded = false;
	}

	shouldLoadData() {
		return this.store.lazy
			&& this.store.loadData
			&& !this.states.loaded;
	}

	updateLeafState() {
		if (this.store.lazy
			&& !this.states.loaded
			&& typeof this.states.isLeafByUser !== 'undefined'
		) {
			this.states.isLeaf = this.states.isLeafByUser;
			return;
		}
		const childNodes = this.childNodes;
		if (!this.store.lazy || (this.store.lazy && this.states.loaded)) {
			this.states.isLeaf = !childNodes || childNodes.length === 0;
			return;
		}
		this.states.isLeaf = false;
	}

	async setChecked(value: boolean | string, deep?: boolean, recursion?: boolean, passValue?: boolean) {
		this.states.indeterminate = value === 'half';
		this.states.checked = value === true;

		if (this.store.checkStrictly) return;

		if (!(this.shouldLoadData() && !this.store.checkDescendants)) {
			const { all, allWithoutDisable } = getChildState(this.childNodes);

			if (!this.states.isLeaf && (!all && allWithoutDisable)) {
				this.states.checked = false;
				value = false;
			}

			const handleDescendants = () => {
				if (deep) {
					const childNodes = this.childNodes;
					for (let i = 0, j = childNodes.length; i < j; i++) {
						const child = childNodes[i];
						passValue = passValue || value !== false;
						const isCheck = child.getter.disabled ? child.states.checked : passValue;
						child.setChecked(isCheck, deep, true, passValue);
					}
					const { half, all: $all } = getChildState(childNodes);
					if (!$all) {
						this.states.checked = $all;
						this.states.indeterminate = half;
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

		const parent = this.parentNode;
		if (!parent || parent.states.level === 0) return;

		if (!recursion) {
			reInitChecked(parent);
		}
	}

	getChildren(forceInit = false): Nullable<Array<any>> { // this is data
		if (this.states.level === 0) return this.states.data;
		const data = this.states.data;
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
		const oldData = this.childNodes.map(node => node.states.data);

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
			&& !this.states.loaded
			&& (!this.states.loading || Object.keys(defaultProps).length)
		) {
			this.states.loading = true;
			const children: any[] = await this.store.loadData(this);
			this.states.loaded = true;
			this.states.loading = false;
			this.childNodes = [];

			this.doCreateChildren(children, defaultProps);

			this.updateLeafState();

			return children;
		}
	}
}
