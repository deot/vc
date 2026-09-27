/** @jsxImportSource vue */

import { getCurrentInstance, defineComponent, inject, ref, watch, nextTick, withModifiers, toRaw } from 'vue';
import { isEqualWith } from 'lodash-es';
import type { TreeNode, TreeStore } from './store';
import { KEY_VALUE } from './store/constant';
import { TransitionCollapse } from '../transition';
import { Checkbox } from '../checkbox';
import { Customer } from '../customer';
import { Spin } from '../spin';
import { Icon } from '../icon';
import { toModelValue } from '../select/utils';
import { useCollectNode } from './use-collect-node';
import { props as treeNodeProps } from './tree-node-content-props';
import type {
	TreeCheckChangePayload,
	TreeCheckPayload,
	TreeCurrentChangePayload,
	TreeNodeEventPayload,
	TreeNodeExpandChangePayload,
	TreeProvide
} from './types';

const COMPONENT_NAME = 'vc-tree-node';

export const TreeNodeContent = defineComponent({
	name: COMPONENT_NAME,
	props: treeNodeProps,
	emits: ['node-expand'],
	setup(props, { emit }) {
		const instance = getCurrentInstance()!;
		const collector = useCollectNode();

		const tree = inject<TreeProvide>('vc-tree')!;
		const formItem = inject<any>('vc-form-item', {});

		const expanded = ref(!!props.node.states.expanded);
		const childNodeRendered = ref(!!props.node.states.expanded);
		const oldChecked = ref(false);
		const oldIndeterminate = ref(false);

		const sync = () => {
			const store = tree.store as TreeStore;
			const data = {
				checkedNodes: store.getCheckedNodes(),
				checkedValues: store.getCheckedValues(),
				halfCheckedNodes: store.getHalfCheckedNodes(),
				halfCheckedValues: store.getHalfCheckedValues(),
			};

			const v = toModelValue(data.checkedValues, {
				modelValue: tree.props.modelValue,
				max: tree.props.max,
				numerable: tree.props.numerable,
				separator: tree.props.separator,
				nullValue: tree.props.nullValue
			});
			// for v-model
			if (!isEqualWith(v, tree.props.modelValue)) {
				tree.emit('update:modelValue', v, data);
				tree.emit('change', v, data);
				props.allowDispatch && formItem?.change?.();
			}

			return data;
		};
		const getNodeKey = (node: TreeNode) => {
			return node.states.data[tree.props.keyValue.value];
		};

		const handleSelectChange = (checked: boolean, indeterminate: boolean) => {
			// 选中或半选任一变化即发出
			if (oldChecked.value !== checked || oldIndeterminate.value !== indeterminate) {
				tree.emit('check-change', {
					node: props.node,
					data: props.node.states.data,
					checked,
					indeterminate
				} satisfies TreeCheckChangePayload);
			}
			oldChecked.value = checked;
			oldIndeterminate.value = indeterminate;
		};

		const handleCheckChange = async (_: boolean, e: any) => {
			props.node.setChecked(e.target.checked, !tree.props.checkStrictly);
			await nextTick();
			tree.emit('check', {
				node: props.node,
				data: props.node.states.data,
				checked: props.node.states.checked,
				...sync()
			} satisfies TreeCheckPayload);
		};

		// 展开 / 收起的参数
		const toExpandPayload = (value: boolean): TreeNodeExpandChangePayload => ({
			node: props.node,
			data: props.node.states.data,
			expanded: value,
			instance
		});

		// 节点事件（node-click / node-contextmenu）的参数
		const toNodePayload = (e: Event): TreeNodeEventPayload => ({
			node: props.node,
			data: props.node.states.data,
			instance,
			event: e
		});

		const handleExpandIconClick = async () => {
			if (props.node.states.isLeaf) return;
			if (expanded.value) {
				tree.emit('node-expand-change', toExpandPayload(false));
				props.node.collapse();
			} else {
				await props.node.expand();
				sync();
				// 交给父级：accordion 时先收起同级节点，再发出 node-expand-change
				emit('node-expand', toExpandPayload(true));
			}
		};

		const handleClick = (e: Event) => {
			const store = tree.store;
			const oldNode = store.currentNode;
			store.setCurrentNode(props.node);
			// 当前节点不变时不发出
			if (toRaw(store.currentNode) !== toRaw(oldNode)) {
				tree.emit('current-change', {
					node: store.currentNode!,
					data: store.currentNode!.states.data,
					oldNode
				} satisfies TreeCurrentChangePayload);
			}

			tree.currentNodeInstance.value = instance;

			if (tree.props.expandOnClickNode) {
				handleExpandIconClick();
			}
			if (tree.props.checkOnClickNode && !props.node.getter.disabled) {
				const checked = !props.node.states.checked;
				handleCheckChange(checked, {
					target: { checked }
				});
			}
			tree.emit('node-click', toNodePayload(e));
		};

		const handleContextMenu = (e: any) => {
			if (tree.instance.vnode.props!['onNodeContextmenu']) {
				e.stopPropagation();
				e.preventDefault();
			}
			tree.emit('node-contextmenu', toNodePayload(e));
		};

		const handleChildNodeExpand = (payload: TreeNodeExpandChangePayload) => {
			collector.broadcast(payload.node);
			tree.emit('node-expand-change', payload);
		};

		const handleDragStart = (e: any) => {
			if (!tree.props.draggable) return;
			tree.drag.emit('dragstart', e, instance);
		};

		const handleDragOver = (e: any) => {
			if (!tree.props.draggable) return;
			tree.drag.emit('dragover', e, instance);
			e.preventDefault();
		};

		const handleDrop = (e: any) => {
			e.preventDefault();
		};

		const handleDragEnd = (e: any) => {
			if (!tree.props.draggable) return;
			tree.drag.emit('dragend', e, instance);
		};

		watch(
			() => {
				const childrenKey = tree.props.keyValue.children || KEY_VALUE.children;
				return props.node.states.data[childrenKey];
			},
			(v) => {
				handleSelectChange(props.node.states.checked, v);
			}
		);

		watch(
			() => props.node.states.indeterminate,
			(v) => {
				handleSelectChange(props.node.states.checked, v);
			}
		);

		watch(
			() => props.node.states.checked,
			(v) => {
				handleSelectChange(v, props.node.states.indeterminate);
			}
		);

		watch(
			() => props.node.states.expanded,
			(v) => {
				if (v) {
					childNodeRendered.value = true;
				}
				nextTick(() => expanded.value = v);
			},
			{ deep: true }
		);

		return () => {
			const { node } = props;
			return (
				<div
					// @ts-ignore
					vShow={node.states.visible}
					class={[
						{
							'is-expanded': expanded.value,
							'is-current': node.states.isCurrent,
							'is-hidden': !node.states.visible,
							'is-focusable': !node.getter.disabled,
							'is-checked': !node.getter.disabled && node.states.checked
						},
						'vc-tree-node'
					]}
					aria-expanded={expanded.value}
					aria-disabled={node.getter.disabled}
					aria-checked={node.states.checked}
					draggable={tree.props.draggable}
					role="treeitem"
					tabindex="-1"
					onClick={withModifiers(handleClick, ['stop'])}
					onContextmenu={handleContextMenu}
					onDragstart={withModifiers(handleDragStart, ['stop'])}
					onDragover={withModifiers(handleDragOver, ['stop'])}
					onDragend={withModifiers(handleDragEnd, ['stop'])}
					onDrop={withModifiers(handleDrop, ['stop'])}
				>
					<div
						style={[{ 'padding-left': (node.states.level - 1) * tree.props.indent + 'px' }]}
						class="vc-tree-node__content"
					>
						<span
							class={[
								{
									'is-expand': !node.states.isLeaf && expanded.value,
									'is-leaf': node.states.isLeaf
								},
								'vc-tree-node__expand-icon'
							]}
							onClick={withModifiers(handleExpandIconClick, ['stop'])}
						>
							<Icon type="triangle-up" />
						</span>
						{
							props.showCheckbox && (
								<Checkbox
									modelValue={node.states.checked}
									indeterminate={node.states.indeterminate}
									disabled={!!node.getter.disabled}
									onUpdate:modelValue={v => node.states.checked = v}
									onChange={handleCheckChange}
									// @ts-ignore
									onClick={withModifiers(() => {}, ['stop'])}
								/>
							)
						}

						{
							node.states.loading && (
								<Spin
									size={12}
									class="vc-tree-node__loading-icon"
								/>
							)
						}

						{
							props.renderNodeLabel
								? (
										<Customer
											render={props.renderNodeLabel}
											// @ts-ignore
											store={node}
											row={node.states.data}
										/>
									)
								: <span class="vc-tree-node__label">{node.getter.label}</span>
						}
					</div>
					<TransitionCollapse>
						{
							(!props.renderNodeAfterExpand || childNodeRendered.value) && (
								<div
									// @ts-ignore
									vShow={expanded.value}
									aria-expanded={expanded.value}
									class="vc-tree-node__children"
									role="group"
								>
									{
										node.childNodes.map((child: TreeNode) => {
											return (
												<TreeNodeContent
													key={getNodeKey(child)}
													renderNodeLabel={props.renderNodeLabel}
													renderNodeAfterExpand={props.renderNodeAfterExpand}
													showCheckbox={props.showCheckbox}
													allowDispatch={props.allowDispatch}
													accordion={props.accordion}
													node={child}
													// @ts-ignore
													onNodeExpand={handleChildNodeExpand}
												/>
											);
										})
									}
								</div>
							)
						}
					</TransitionCollapse>
				</div>
			);
		};
	}
});
