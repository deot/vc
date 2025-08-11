/** @jsxImportSource vue */

import { getCurrentInstance, defineComponent, inject, ref, watch, nextTick, withModifiers } from 'vue';
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
import type { TreeProvide } from './types';

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
			if (oldChecked.value !== checked && oldIndeterminate.value !== indeterminate) {
				tree.emit('check-change', props.node.states.data, checked, indeterminate);
			}
			oldChecked.value = checked;
			oldIndeterminate.value = indeterminate;
		};

		const handleCheckChange = async (_: boolean, e: any) => {
			props.node.setChecked(e.target.checked, !tree.props.checkStrictly);
			await nextTick();
			tree.emit('check', props.node.states.data, sync());
		};

		const handleExpandIconClick = async () => {
			if (props.node.states.isLeaf) return;
			if (expanded.value) {
				tree.emit('node-collapse', props.node.states.data, props.node, instance);
				props.node.collapse();
			} else {
				await props.node.expand();
				sync();
				emit('node-expand', props.node.states.data, props.node, instance);
			}
		};

		const handleClick = () => {
			const store = tree.store;
			store.setCurrentNode(props.node);
			tree.emit('current-change', store.currentNode ? store.currentNode.states.data : null, store.currentNode);

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
			tree.emit('node-click', props.node.states.data, props.node, instance);
		};

		const handleContextMenu = (e: any) => {
			if (tree.instance.vnode.props!['onNodeContextmenu']) {
				e.stopPropagation();
				e.preventDefault();
			}
			tree.emit('node-contextmenu', e, props.node.states.data, props.node, instance);
		};

		const handleChildNodeExpand = (nodeData: object, node: TreeNode, $instance: any) => {
			collector.broadcast(node);
			tree.emit('node-expand', nodeData, node, $instance);
		};

		const handleDragStart = (e: any) => {
			if (!tree.props.draggable) return;
			tree.drag.emit('drag-start', e, instance);
		};

		const handleDragOver = (e: any) => {
			if (!tree.props.draggable) return;
			tree.drag.emit('drag-over', e, instance);
			e.preventDefault();
		};

		const handleDrop = (e: any) => {
			e.preventDefault();
		};

		const handleDragEnd = (e: any) => {
			if (!tree.props.draggable) return;
			tree.drag.emit('drag-end', e, instance);
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
							props.render
								? (
										<Customer
											render={props.render}
											// @ts-ignore
											store={node}
											row={node.states.data}
										/>
									)
								: <span>{node.getter.label}</span>
						}
					</div>
					<TransitionCollapse>
						{
							(!props.renderAfterExpand || childNodeRendered.value) && (
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
													render={props.render}
													renderAfterExpand={props.renderAfterExpand}
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
