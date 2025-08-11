/** @jsxImportSource vue */

import { defineComponent, provide, ref, computed, watch, getCurrentInstance } from 'vue';
import type { ComponentInternalInstance } from 'vue';
import type { TreeNode } from './store/tree-node';
import { TreeStore } from './store/tree-store';
import { toCurrentValue } from '../select/utils';
import { TreeNodeContent } from './tree-node-content.tsx';
import { useDragNode } from './use-drag-node';
import { useKeydown } from './use-keydown';
import { useCollectNode } from './use-collect-node';

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
		'node-collapse',
		'node-expand',
		'check',
		'node-drag-start',
		'node-drag-end',
		'node-drop',
		'node-drag-leave',
		'node-drag-enter',
		'node-drag-over'
	],
	setup(props, { expose, emit }) {
		const instance = getCurrentInstance();
		const store = new TreeStore({
			data: props.data,
			lazy: props.lazy,
			keyValue: props.keyValue,
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
		const currentNodeInstance = ref<ComponentInternalInstance>();
		const dropIndicator = ref<HTMLElement>();

		const drag = useDragNode(store, dropIndicator);
		const collector = useCollectNode();

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
			return node.states.data[props.keyValue.value];
		};

		const getNodePath = (data: any) => {
			if (!props.keyValue.value) throw new Error('[Tree] keyValue.value is required in getNodePath');
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
			if (!props.keyValue.value) throw new Error('[Tree] keyValue.value is required in getCurrentKey');
			const $currentNode = getCurrentNode();
			return $currentNode ? $currentNode[props.keyValue.value] : null;
		};

		const setCheckedNodes = (nodes: any, leafOnly: any) => {
			if (!props.keyValue.value) throw new Error('[Tree] keyValue.value is required in setCheckedNodes');
			store.setCheckedNodes(nodes, leafOnly);
		};

		const setCheckedValues = (values: any) => {
			if (!props.keyValue.value) throw new Error('[Tree] keyValue.value is required in setCheckedValues');
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
			if (!props.keyValue.value) throw new Error('[Tree] keyValue.value is required in setCurrentNode');
			store.setUserCurrentNode(node);
		};

		const setCurrentNodeByData = (data: any) => {
			if (!props.keyValue.value) throw new Error('[Tree] keyValue.value is required in setCurrentNodeByData');
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

		const handleNodeExpand = (nodeData: any, node: any, $instance: any) => {
			collector.broadcast(node);
			emit('node-expand', nodeData, node, $instance);
		};

		const updateKeyChildren = (key: any, data: any) => {
			if (!props.keyValue.value) throw new Error('[Tree] keyValue.value is required in updateKeyChild');
			store.updateChildren(key, data);
		};

		useKeydown();
		provide('vc-tree', {
			props,
			store,
			root,
			emit,
			drag,
			instance,
			currentNodeInstance
		});

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
			handleNodeExpand,
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
					{
						root.childNodes.map((child: TreeNode) => {
							return (
								<TreeNodeContent
									key={getNodeKey(child)}
									render={props.render}
									renderAfterExpand={props.renderAfterExpand}
									showCheckbox={props.showCheckbox}
									allowDispatch={props.allowDispatch}
									accordion={props.accordion}
									node={child}
									// @ts-ignore
									onNodeExpand={handleNodeExpand}
								/>
							);
						})
					}
					{
						isEmpty.value && (
							<div class="vc-tree__empty-block">
								<span class="vc-tree__empty-text">{props.emptyText}</span>
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
