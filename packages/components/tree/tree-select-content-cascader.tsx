/** @jsxImportSource vue */

import { defineComponent, ref, computed, watch, nextTick } from 'vue';
import type { PropType } from 'vue';
import type { Render } from '../customer/types';
import type { TreeData, TreeValue } from '../select/utils';
import { Checkbox } from '../checkbox/index';
import { Customer } from '../customer/index';
import { Icon } from '../icon/index';
import { Tree } from './tree';

const COMPONENT_NAME = 'vc-tree-select-content-cascader';

export const TreeSelectContentCascader = defineComponent({
	name: COMPONENT_NAME,
	props: {
		value: {
			type: Array as () => Array<string | number>,
			required: true
		},
		data: {
			type: Array as PropType<TreeData[]>,
			default: () => []
		},
		checkStrictly: {
			type: Boolean,
			default: false
		},
		renderNodeLabel: Function as Render,
		numerable: {
			type: Boolean,
			default: false
		},
		separator: {
			type: String,
			default: ','
		},
		max: {
			type: Number,
			default: 1
		},
		nullValue: {
			type: [Number, String, Object] as PropType<unknown>,
			default: void 0
		}
	},
	emits: ['change'],
	setup(props, { emit }) {
		const treeRef = ref<any>(null);
		/** hover 展开路径，与 Cascader 一致 */
		const currentValue = ref<TreeValue[]>([]);
		const rebuildData = computed(() => {
			if (!props.data.length) return [];
			let temp: TreeData[] = props.data;
			const data: TreeData[][] = [];
			currentValue.value.forEach((cur) => {
				const col = temp;
				data.push(col);
				const next = (temp.find(i => i.value == cur) || {}).children || [];
				temp = next;
			});
			data.push(temp);
			return data;
		});
		/** 驱动列区在 TreeStore 更新后重绘 */
		const panelTick = ref(0);

		const columns = computed(() =>
			Array.from({ length: currentValue.value.length + 1 }).map((_, index) => index)
		);

		const handleHover = (value: TreeValue, columnIndex: number) => {
			const len = currentValue.value.length - columnIndex;
			currentValue.value.splice(columnIndex, len, value);
		};

		const sync = async () => {
			await nextTick();
			const tree = treeRef.value;
			if (!tree) return;
			const data = {
				checkedNodes: tree.getCheckedNodes(),
				checkedValues: tree.getCheckedValues(),
				halfCheckedNodes: tree.getHalfCheckedNodes(),
				halfCheckedValues: tree.getHalfCheckedValues()
			};
			panelTick.value++;
			emit('change', null, data);
		};

		const getNodeState = (item: TreeData) => {
			const tree = treeRef.value;
			if (!tree) {
				return { checked: false, indeterminate: false };
			}
			const node = tree.getNode(item);
			if (!node) {
				return { checked: false, indeterminate: false };
			}
			return {
				checked: !!node.states.checked,
				indeterminate: !!node.states.indeterminate
			};
		};

		const hasChildren = (item: TreeData) => {
			return !!(item.children && item.children.length > 0);
		};

		const handleCheckboxChange = async (v: any, item: TreeData) => {
			const tree = treeRef.value;
			if (!tree) return;
			tree.setChecked(item, v, !props.checkStrictly);

			sync();
		};

		const handleLabelClick = (v: any, item: TreeData) => {
			const tree = treeRef.value;
			if (!tree) return;
			tree.setChecked(item, v, !props.checkStrictly);

			sync();
		};

		return () => {
			return (
				<div class="vc-tree-select__cascader">
					<Tree
						ref={treeRef}
						class="vc-tree-select__cascader-tree-hidden"
						model-value={props.value}
						expanded-values={props.value}
						data={props.data}
						checkStrictly={props.checkStrictly}
						allowDispatch={false}
						showCheckbox={true}
						renderNodeLabel={props.renderNodeLabel}
						numerable={props.numerable}
						separator={props.separator}
						max={props.max}
						nullValue={props.nullValue}
					/>
					<div class="vc-tree-select__cascader-columns">
						{
							columns.value.map((columnIndex) => {
								const col = rebuildData.value[columnIndex];
								if (!col || !col.length) return null;
								return (
									<div class="vc-tree-select__cascader-column" key={columnIndex}>
										<div class="vc-tree-select__cascader-column-wrapper">
											{
												col.map((item: TreeData) => {
													const state = getNodeState(item);
													const isSelect = currentValue.value[columnIndex] === item.value;
													const child = hasChildren(item);
													return (
														<div
															key={item.value}
															class={[
																'vc-tree-select__cascader-item',
																{ 'is-select': isSelect }
															]}
															onMouseenter={() => handleHover(item.value, columnIndex)}
															onClick={() => handleLabelClick(!state.checked, item)}
														>
															<span
																class="vc-tree-select__cascader-checkbox"
																onClick={(e: MouseEvent) => e.stopPropagation()}
															>
																<Checkbox
																	modelValue={state.checked}
																	indeterminate={state.indeterminate}
																	disabled={!!item.disabled}
																	onChange={v => handleCheckboxChange(v, item)}
																/>
															</span>
															<span class="vc-tree-select__cascader-label">
																{
																	props.renderNodeLabel && treeRef.value?.getNode?.(item)
																		? (
																				<Customer
																					render={props.renderNodeLabel}
																					// @ts-ignore
																					store={treeRef.value.getNode(item)}
																					row={item}
																				/>
																			)
																		: (
																				<span>{item.label}</span>
																			)
																}
															</span>
															{
																child ? (<Icon type="right" class="vc-tree-select__cascader-icon" />) : null
															}
														</div>
													);
												})
											}
										</div>
									</div>
								);
							})
						}
					</div>
				</div>
			);
		};
	}
});
