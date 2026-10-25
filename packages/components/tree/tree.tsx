/** @jsxImportSource vue */

import { defineComponent, provide, ref, computed, watch, getCurrentInstance, shallowReactive, inject } from 'vue';
import type { ComponentInternalInstance } from 'vue';
import { isEqualWith } from 'lodash-es';
import type { TreeNode } from './store/tree-node';
import type { TreeCheckChangePayload, TreeNodeExpandChangePayload, TreeProvide } from './types';
import { KEY_VALUE } from './store/constant';
import { TreeStore } from './store/tree-store';
import { toCurrentValue, toModelValue } from '../select/utils';
import { Customer } from '../customer';
import { useLocale } from '../locale';
import { SelectList } from '../select/select-list';
import { TreeNodeContent, collectVisibleNodes } from './tree-node-content.tsx';
import { useDragNode } from './use-drag-node';
import { useKeydown } from './use-keydown';

import { props as treeProps } from './tree-props';

const COMPONENT_NAME = 'vc-tree';

export const Tree = defineComponent({
	name: COMPONENT_NAME,
	props: treeProps,
	emits: [
		'update:modelValue',
		'change',
		'check-change',
		'current-change',
		'node-click',
		'node-contextmenu',
		'node-expand-change',
		'check',
		'node-dragstart',
		'node-dragend',
		'node-drop',
		'node-dragleave',
		'node-dragenter',
		'node-dragover'
	],
	setup(props, { expose, emit, slots }) {
		const { t } = useLocale();
		const instance = getCurrentInstance();
		const store = new TreeStore({
			data: props.data,
			lazy: props.lazy,
			// 只传部分字段时，其余字段取默认值
			keyValue: { ...KEY_VALUE, ...props.keyValue },
			loadData: props.loadData,
			currentNodeValue: props.currentNodeValue,
			checkStrictly: props.checkStrictly,
			checkDescendants: props.checkDescendants,
			checkedValues: toCurrentValue(props.modelValue, {
				numerable: props.numerable,
				separator: props.separator
			}),
			expandedValues: [...props.expandedValues],
			autoExpandParent: props.autoExpandParent,
			defaultExpandAll: props.defaultExpandAll,
			filterNode: props.filterNode
		});
		const root = store.root;
		const dropIndicator = ref<HTMLElement>();
		const formItem = inject<any>('vc-form-item', {});

		const drag = useDragNode(store, dropIndicator);

		// 节点的勾选 / 半选状态变化：由 store 在同一轮写入结束后发出，未渲染的节点也会发出
		store.onCheckChange = node => emit('check-change', {
			node,
			data: node.states.data,
			checked: node.states.checked,
			indeterminate: node.states.indeterminate
		} satisfies TreeCheckChangePayload);

		// 正在展开 / 收起动画的节点，见 TreeNodeMotion
		const motions = shallowReactive(new Map<TreeNode, 'expand' | 'collapse'>());

		// 铺平的可见节点：逐行渲染；展开的节点才下钻，正在动画的节点的子孙在它的动画块里
		const rows = computed(() => collectVisibleNodes(root.childNodes, motions));

		const isEmpty = computed(() => {
			const { childNodes } = root;
			return !childNodes || childNodes.length === 0 || childNodes.every(({ states }) => !states.visible);
		});

		watch(
			() => props.modelValue,
			(v: any) => store.setCheckedValues(
				toCurrentValue(v, {
					numerable: props.numerable,
					separator: props.separator
				})
			)
		);

		watch(
			() => props.expandedValues,
			(v: any[]) => store.setExpandedValues([...v])
		);

		watch(
			() => props.data,
			(v: any) => store.setData(v)
		);

		watch(
			() => props.checkStrictly,
			(v: boolean) => {
				store.checkStrictly = v;
			}
		);

		const filter = (value: any) => {
			if (!props.filterNode) throw new Error('[Tree] filterNode is required when filter');
			store.filter(value);
		};

		const getNodeKey = (node: TreeNode) => {
			return node.states.data[store.keyValue.value];
		};

		const getNodePath = (data: any) => {
			if (!store.keyValue.value) throw new Error('[Tree] keyValue.value is required in getNodePath');
			const node = store.getNode(data);
			if (!node) return [];
			const path = [node.states.data];
			let parent = node.parentNode;
			while (parent && parent !== root) {
				path.push(parent.states.data);
				parent = parent.parentNode;
			}
			return path.reverse();
		};

		const getCheckedNodes = (leafOnly: any, includeHalfChecked: any) => {
			return store.getCheckedNodes(leafOnly, includeHalfChecked);
		};

		const getCheckedValues = (leafOnly: any) => {
			return store.getCheckedValues(leafOnly);
		};

		const getCurrentNode = () => {
			const $currentNode = store.getCurrentNode();
			return $currentNode ? $currentNode.states.data : null;
		};

		const getCurrentKey = () => {
			if (!store.keyValue.value) throw new Error('[Tree] keyValue.value is required in getCurrentKey');
			const $currentNode = getCurrentNode();
			return $currentNode ? $currentNode[store.keyValue.value] : null;
		};

		const setCheckedNodes = (nodes: any, leafOnly: any) => {
			if (!store.keyValue.value) throw new Error('[Tree] keyValue.value is required in setCheckedNodes');
			store.setCheckedNodes(nodes, leafOnly);
		};

		const setCheckedValues = (values: any) => {
			if (!store.keyValue.value) throw new Error('[Tree] keyValue.value is required in setCheckedValues');
			store.setCheckedValues(values);
		};

		const setChecked = (data: any, checked: any, deep: any) => {
			store.setChecked(data, checked, deep);
		};

		const getHalfCheckedNodes = () => {
			return store.getHalfCheckedNodes();
		};

		const getHalfCheckedValues = () => {
			return store.getHalfCheckedValues();
		};

		const setCurrentNode = (node: any) => {
			if (!store.keyValue.value) throw new Error('[Tree] keyValue.value is required in setCurrentNode');
			store.setUserCurrentNode(node);
		};

		const setCurrentNodeByData = (data: any) => {
			if (!store.keyValue.value) throw new Error('[Tree] keyValue.value is required in setCurrentNodeByData');
			store.setCurrentNodeByData(data);
		};

		const getNode = (data: any) => {
			return store.getNode(data);
		};

		const remove = (data: any) => {
			store.remove(data);
		};

		const append = (data: any, parentNode: any) => {
			store.append(data, parentNode);
		};

		const insertBefore = (data: any, refNode: any) => {
			store.insertBefore(data, refNode);
		};

		const insertAfter = (data: any, refNode: any) => {
			store.insertAfter(data, refNode);
		};

		/**
		 * 按当前勾选同步 v-model
		 * @returns 勾选数据
		 */
		const sync = () => {
			const data = {
				checkedNodes: store.getCheckedNodes(),
				checkedValues: store.getCheckedValues(),
				halfCheckedNodes: store.getHalfCheckedNodes(),
				halfCheckedValues: store.getHalfCheckedValues()
			};

			const v = toModelValue(data.checkedValues, {
				modelValue: props.modelValue,
				max: props.max,
				numerable: props.numerable,
				separator: props.separator,
				nullValue: props.nullValue
			});
			if (!isEqualWith(v, props.modelValue)) {
				emit('update:modelValue', v, data);
				emit('change', v, data);
				props.allowDispatch && formItem?.change?.();
			}

			return data;
		};

		/**
		 * 用户发起的展开 / 收起（点击图标或节点）：带动画；展开后 accordion 收起同级节点，再发出 node-expand-change
		 * 	- 动画进行中再次点击：立即结束当前动画，按新的方向开始，快速连点不丢操作
		 * @param node ~
		 * @param row 节点所在行的组件实例
		 */
		const toggle = async (node: TreeNode, row: ComponentInternalInstance) => {
			if (node.states.isLeaf) return;
			motions.delete(node);
			const toPayload = (expanded: boolean): TreeNodeExpandChangePayload => ({ node, data: node.states.data, expanded, instance: row });
			if (node.states.expanded) {
				emit('node-expand-change', toPayload(false));
				motions.set(node, 'collapse');
				node.collapse();
				return;
			}
			// 先进入动画再展开：子孙直接出现在动画块里，不在铺平的列表里闪现
			motions.set(node, 'expand');
			await node.expand();
			// 加载失败等未能展开
			!node.states.expanded && motions.get(node) === 'expand' && motions.delete(node);
			sync();
			props.accordion && node.collapseSiblings();
			emit('node-expand-change', toPayload(true));
		};

		const renderNode = (node: TreeNode) => {
			return (
				<TreeNodeContent
					key={getNodeKey(node)}
					node={node}
					renderNodeLabel={props.renderNodeLabel}
					showCheckbox={props.showCheckbox}
					allowDispatch={props.allowDispatch}
				/>
			);
		};

		const updateKeyChildren = (key: any, data: any) => {
			if (!store.keyValue.value) throw new Error('[Tree] keyValue.value is required in updateKeyChild');
			store.updateChildren(key, data);
		};

		useKeydown();
		provide('vc-tree', {
			props,
			store,
			root,
			emit,
			drag,
			instance: instance!,
			motions,
			toggle,
			sync,
			renderNode
		} satisfies TreeProvide);

		expose({
			filter,
			getNodeKey,
			getNodePath,
			getCheckedNodes,
			getCheckedValues,
			getCurrentNode,
			getCurrentKey,
			setCheckedNodes,
			setCheckedValues,
			setChecked,
			getHalfCheckedNodes,
			getHalfCheckedValues,
			setCurrentNode,
			setCurrentNodeByData,
			getNode,
			remove,
			append,
			insertBefore,
			insertAfter,
			updateKeyChildren,
		});
		return () => {
			const dragState = drag.state;
			return (
				<div
					class={[
						{
							'vc-tree--highlight-current': props.highlightCurrent,
							'is-dragging': !!dragState.draggingNode,
							'is-drop-not-allow': !dragState.allowDrop,
							'is-drop-inner': dragState.dropType === 'inner'
						},
						'vc-tree'
					]}
					role="tree"
				>
					<SelectList data={rows.value}>
						{{ default: ({ row }: { row: TreeNode }) => renderNode(row), $stable: true }}
					</SelectList>
					{
						isEmpty.value && (
							<div class="vc-tree__empty-block">
								<Customer
									tag="span"
									class="vc-tree__empty-text"
									render={slots.empty || (props.emptyText ?? t('vc.Tree.emptyText'))}
								/>
							</div>
						)
					}
					<div
						ref={dropIndicator}
						// @ts-ignore
						vShow={dragState.showDropIndicator}
						class="vc-tree__drop-indicator"
					/>
				</div>
			);
		};
	}
});
