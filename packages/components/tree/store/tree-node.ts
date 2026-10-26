import { reactive, toRaw, markRaw } from 'vue';
import { hasOwn } from '@deot/helper-utils';
import type { Nullable } from '@deot/helper-shared';
import type { TreeStore } from './tree-store';

import { KEY_NODE } from './constant';

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

/**
 * 写入勾选状态：所有写入都经过这里，store 据此在同一轮写入结束后发出变化（见 TreeStore.markCheckChange）
 * @param node ~
 * @param checked ~
 * @param indeterminate ~
 */
const setCheckState = (node: TreeNode, checked: boolean, indeterminate: boolean) => {
	node.store.markCheckChange(node);
	node.states.checked = checked;
	node.states.indeterminate = indeterminate;
};

const reInitChecked = (node: TreeNode) => {
	if (node.childNodes.length === 0) return;

	const { all, none, half } = getChildState(node.childNodes);
	if (all) {
		setCheckState(node, true, false);
	} else if (half) {
		setCheckState(node, false, true);
	} else if (none) {
		setCheckState(node, false, false);
	}

	const parent = node.parentNode;
	if (!parent || parent.states.level === 0) return;

	if (!node.store.checkStrictly) {
		reInitChecked(parent);
	}
};

/**
 * 按 keyValue 读取节点数据上的字段
 * @param node ~
 * @param prop ~
 * @param data 默认经过 states 读（在 effect 中会被追踪）；构造、登记等不需要追踪的场合传原始数据，避免为每个数据对象建代理
 * @returns ~
 */
const getPropertyFromData = (node: TreeNode, prop: string, data: any = node.states.data) => {
	const keyValue = node.store.keyValue;
	data = data || {};
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

/**
 * 不经过代理读取节点的值（nodesMap 的键）
 * @param node ~
 * @returns ~
 */
export const getRawValue = (node: TreeNode) => getPropertyFromData(node, 'value', toRaw(node.states).data);

// 每次读取时按 keyValue 现读：在渲染等 effect 中读取会追踪 states.data，其余场合不建依赖
class TreeNodeGetter {
	constructor(readonly node: TreeNode) {}

	get label() {
		return getPropertyFromData(this.node, 'label');
	}

	get value() {
		return getPropertyFromData(this.node, 'value');
	}

	get disabled() {
		return getPropertyFromData(this.node, 'disabled');
	}
}

const createStates = () => ({
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

type States = ReturnType<typeof createStates>;
type Options = Omit<Partial<TreeNode>, 'states'> & {
	states?: Partial<States>;
};
let nodeIdSeed = 0;

export class TreeNode {
	id = nodeIdSeed++;
	states: States;

	getter = new TreeNodeGetter(this);

	childNodes: TreeNode[] = reactive([]);

	store!: TreeStore;
	parentNode: Nullable<TreeNode> = null;

	constructor(options: Options) {
		// 节点自身不做深层代理（states / childNodes 已各自 reactive）
		markRaw(this);
		let initial: Partial<States> | undefined;
		for (const name in options) {
			if (hasOwn(options, name)) {
				if (name === 'states') {
					initial = options[name];
				} else {
					this[name] = options[name];
				}
			}
		}
		const store = this.store;
		if (!store) {
			throw new Error('[Node]store is required!');
		}
		const { keyValue } = store;

		// 构造期间直接写原始对象：此时还没有 effect 订阅这个节点
		const data = toRaw(initial?.data ?? null);
		const raw: States = { ...createStates(), ...initial, data };
		raw.loaded = !!(data && data[keyValue.children]);
		raw.loading = false;
		if (this.parentNode) {
			raw.level = this.parentNode.states.level + 1;
		}
		this.states = reactive(raw);

		store.registerNode(this);

		if (keyValue && typeof keyValue.isLeaf !== 'undefined') {
			const isLeaf = getPropertyFromData(this, keyValue.isLeaf, data);
			if (typeof isLeaf === 'boolean') {
				raw.isLeafByUser = isLeaf;
			}
		}

		if (!data) return;

		this.createChildNodes(data, toRaw(this.childNodes));
		if (store.defaultExpandAll && data[keyValue.children]) {
			raw.expanded = true;
		}

		if (!Array.isArray(data)) {
			markNodeData(this, data);
		}

		const key = store.primaryKey;
		const value = data[key];
		if (key && store.hasExpandedValue(value)) {
			this.expand(store.autoExpandParent);
		}

		if (key && store.currentNodeValue !== undefined && value === store.currentNodeValue) {
			store.currentNode = this;
			raw.isCurrent = true;
		}

		if (store.lazy) {
			store._initDefaultCheckedNode(this);
		}

		raw.isLeaf = this.getLeafState();
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
		data = toRaw(data);
		if (!Array.isArray(data)) {
			markNodeData(this, data);
		}

		this.states.data = data;
		this.childNodes.forEach(child => this.store.deregisterNode(child));
		this.childNodes.splice(0, this.childNodes.length);
		this.createChildNodes(data, this.childNodes);
		this.updateLeafState();
	}

	/**
	 * 按数据建子节点
	 * @param data 原始数据
	 * @param target 写入的数组：构造中的节点直接写原始数组，已有节点经过代理（Tree 的 rows 依赖它）
	 */
	private createChildNodes(data: any, target: TreeNode[]) {
		const children: any[] = (this.states.level === 0 && Array.isArray(data))
			? data
			: getPropertyFromData(this, 'children', data) || [];

		for (let i = 0, j = children.length; i < j; i++) {
			target.push(new TreeNode({
				parentNode: this,
				store: this.store,
				states: { data: children[i] }
			}));
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

	insertChild(states: Partial<States>, index?: number, batch?: any) {
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
			states
		});

		if (typeof index === 'undefined' || index < 0) {
			this.childNodes.push(child as TreeNode);
		} else {
			this.childNodes.splice(index, 0, child as TreeNode);
		}

		this.updateLeafState();

		return child;
	}

	insertBefore(states: Partial<States>, ref?: TreeNode) {
		let index = -1;
		if (ref) {
			index = this.childNodes.indexOf(ref);
		}
		return this.insertChild(states, index);
	}

	insertAfter(states: Partial<States>, ref?: TreeNode) {
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

	// 收起同级的其他节点（accordion）
	collapseSiblings() {
		this.parentNode?.childNodes.forEach(node => node !== this && node.collapse());
	}

	shouldLoadData() {
		return this.store.lazy
			&& this.store.loadData
			&& !this.states.loaded;
	}

	getLeafState() {
		const { lazy } = this.store;
		const { loaded, isLeafByUser } = this.states;
		if (lazy && !loaded && typeof isLeafByUser !== 'undefined') return isLeafByUser;
		if (!lazy || loaded) return this.childNodes.length === 0;
		return false;
	}

	updateLeafState() {
		this.states.isLeaf = this.getLeafState();
	}

	async setChecked(value: boolean | string, deep?: boolean, recursion?: boolean, passValue?: boolean) {
		setCheckState(this, value === true, value === 'half');

		if (this.store.checkStrictly) return;

		if (!(this.shouldLoadData() && !this.store.checkDescendants)) {
			const { all, allWithoutDisable } = getChildState(this.childNodes);

			if (!this.states.isLeaf && (!all && allWithoutDisable)) {
				setCheckState(this, false, this.states.indeterminate);
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
						setCheckState(this, $all, half);
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

		const children = this.store.keyValue.children;
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
			// 原地清空：childNodes 是响应式数组，铺平的可见节点（Tree 的 rows）依赖它
			this.childNodes.splice(0, this.childNodes.length);

			this.doCreateChildren(children, defaultProps);

			this.updateLeafState();

			return children;
		}
	}
}
