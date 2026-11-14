/** @jsxImportSource vue */

import { defineComponent, provide, ref, computed, watch, getCurrentInstance, shallowReactive, inject, nextTick, onMounted } from 'vue';
import type { ComponentInternalInstance } from 'vue';
import { isEqualWith } from 'lodash-es';
import type { TreeNode } from './store/tree-node';
import type { TreeCheckChangePayload, TreeCheckPayload, TreeHighlightProvide, TreeNodeExpandChangePayload, TreeProvide } from './types';
import { KEY_VALUE } from './store/constant';
import { TreeStore } from './store/tree-store';
import { toCurrentValue, toModelValue } from '../select/utils';
import { Customer } from '../customer';
import { useLocale } from '../locale';
import { SelectList } from '../select/select-list';
import type { SelectListExposed } from '../select/select-list';
import { useNavigate } from '../select/hooks/use-navigate';
import { TreeNodeContent, collectVisibleNodes } from './tree-node-content.tsx';
import { useDragNode } from './use-drag-node';
import { useKeydown, isNodeEnabled, resolveShift } from './use-keydown';

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
			checkStrategy: props.checkStrategy,
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
		const formItem = inject<any>('vc-form-item', {});

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
		const list = ref<SelectListExposed>();

		// 已渲染的行（含动画块里的）：节点 <-> 行组件实例 / 元素，供键盘、高亮与拖拽按节点找行
		const rowInstances = new Map<TreeNode, ComponentInternalInstance>();
		const rowNodes = new WeakMap<Element, TreeNode>();
		const registerRow = (node: TreeNode, row: ComponentInternalInstance) => {
			const el = row.vnode.el as Element;
			rowInstances.set(node, row);
			rowNodes.set(el, node);
			keydown.handleRowMounted(node, el);
		};
		const unregisterRow = (node: TreeNode, row: ComponentInternalInstance) => {
			rowInstances.get(node) === row && rowInstances.delete(node);
		};
		const getElement = (node: TreeNode) => rowInstances.get(node)?.vnode.el as Element | undefined;
		const getNodeOf = (el: Element) => rowNodes.get(el);
		/**
		 * 元素所在的行及其节点（拖拽、悬停高亮用）；嵌套在节点内容里的其他树的行不属于本树（不在登记中）
		 * @param target 元素
		 * @returns 行与节点；不在本树的行上时为 undefined
		 */
		const getNodeAt = (target: EventTarget | null) => {
			const row = (target as Element | null)?.closest?.('[role="treeitem"]');
			const node = row && rowNodes.get(row);
			return node ? { row: row!, node } : void 0;
		};

		const rootEl = ref<HTMLElement | null>(null);
		const drag = useDragNode({ props, store, emit, root: rootEl, getNodeAt, getElement });

		const isEmpty = computed(() => !rows.value.length);

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
			() => props.checkStrategy,
			(v) => {
				store.checkStrategy = v;
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
			const data = store.getCheckedState();
			// 先记下这次的勾选值：父级随后传回相同的 modelValue 时 setCheckedValues 判断相等直接跳过，不必按它把整棵树再写一遍
			store.checkedValues = data.checkedValues;

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
		 * @param row 节点所在行的组件实例；虚拟列表中行未渲染时为 undefined
		 */
		const toggle = async (node: TreeNode, row = rowInstances.get(node)) => {
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
			// 懒加载的子节点会继承勾选状态，加载后才需要同步 v-model
			const loads = node.shouldLoadData();
			await node.expand();
			// 加载失败等未能展开
			!node.states.expanded && motions.get(node) === 'expand' && motions.delete(node);
			loads && sync();
			props.accordion && node.collapseSiblings();
			emit('node-expand-change', toPayload(true));
		};

		/**
		 * 切换勾选（复选框、键盘、TreeSelect 的回车共用）：联动上下级后发出 check，并同步 v-model
		 * @param node ~
		 * @param checked 默认取反
		 */
		const toggleCheck = async (node: TreeNode, checked = !node.states.checked) => {
			if (node.getter.disabled) return;
			node.setChecked(checked, !store.strict);
			await nextTick();
			emit('check', {
				node,
				data: node.states.data,
				checked: node.states.checked,
				...sync()
			} satisfies TreeCheckPayload);
		};

		const keydown = useKeydown({
			getRows: () => rows.value,
			getNode: getNodeOf,
			getElement,
			scrollToIndex: index => list.value?.scrollToIndex(index, 'nearest'),
			toggle,
			toggleCheck,
			showCheckbox: () => props.showCheckbox
		});
		onMounted(keydown.initTabStop);

		/**
		 * TreeSelect（树形模式）注入时改用与 Select / Cascader 一致的键盘高亮：焦点留在触发器或搜索栏
		 * 	- ↑ ↓ 在可见节点间移动；← → 见 resolveShift；回车切换勾选
		 * 	- 打开时高亮第一个勾选的节点（弹层就绪后由 scrollIntoActive 滚动到它），source 变化后为第一个节点
		 * 	- 指针在节点上移动时高亮跟随；展开 / 收起使行增减时按节点重新对上
		 */
		const highlight = inject<TreeHighlightProvide | null>('vc-tree-highlight', null);
		const navigate = highlight && useNavigate<TreeNode>({
			getList: () => rows.value,
			isEnabled: isNodeEnabled,
			prefer: node => node.states.checked,
			select: node => toggleCheck(node),
			source: highlight.source
		});
		if (navigate) {
			watch(rows, () => navigate.sync(), { flush: 'post' });
			onMounted(() => navigate.setList(list.value));
		}

		const shift = (step: number) => {
			const node = rows.value[navigate!.getActive()];
			const target = node && resolveShift(rows.value, node, step);
			if (!target) return;
			'toggle' in target ? toggle(target.toggle) : navigate!.activate(target.index);
		};

		// 只在指针移到另一行时处理
		let hovered: Element | null = null;
		const handleMousemove = (e: MouseEvent) => {
			const hit = getNodeAt(e.target);
			const row = hit?.row || null;
			if (row === hovered) return;
			hovered = row;
			const index = hit ? rows.value.indexOf(hit.node) : -1;
			index !== -1 && navigate!.hover(index);
		};

		const renderNode = (node: TreeNode) => {
			return (
				<TreeNodeContent
					// 按节点对象（id）区分：拖放、setData 等重新创建节点时行重新挂载，行与节点的登记随之更新
					key={node.id}
					node={node}
				/>
			);
		};

		const updateKeyChildren = (key: any, data: any) => {
			if (!store.keyValue.value) throw new Error('[Tree] keyValue.value is required in updateKeyChild');
			store.updateChildren(key, data);
		};

		provide('vc-tree', {
			props,
			store,
			emit,
			instance: instance!,
			motions,
			toggle,
			toggleCheck,
			renderNode,
			registerRow,
			unregisterRow
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
			// TreeSelect 注入高亮时（见 navigate）：交给它的键盘
			...(navigate && {
				move: navigate.move,
				shift,
				enter: navigate.enter,
				scrollIntoActive: navigate.scrollIntoActive
			})
		});
		return () => {
			return (
				<div
					// 拖拽中的 is-dragging / is-drop-not-allow / is-drop-inner 由 useDragNode 直接写在根节点上
					class={[{ 'vc-tree--highlight-current': props.highlightCurrent }, 'vc-tree']}
					ref={rootEl}
					role="tree"
					onKeydown={keydown.handleKeydown}
					onFocusin={keydown.handleFocusin}
					onMousemove={navigate ? handleMousemove : void 0}
					onMousedown={drag.handleMousedown}
					// 拖拽的触摸按下为 passive，不影响滚动
					{...{ onTouchstartPassive: drag.handleTouchstart }}
				>
					<SelectList ref={list} data={rows.value} virtualized={props.virtualized}>
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
				</div>
			);
		};
	}
});
