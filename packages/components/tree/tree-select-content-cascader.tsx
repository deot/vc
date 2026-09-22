/** @jsxImportSource vue */

import { defineComponent, ref, computed, watch, nextTick } from 'vue';
import type { PropType } from 'vue';
import type { Render } from '../customer/types';
import type { TreeData, TreeValue } from '../select/utils';
import { Checkbox } from '../checkbox/index';
import { Customer } from '../customer/index';
import { Icon } from '../icon/index';
import { Scroller } from '../scroller/index';
import { Tree } from './tree';
import { renderHighlight } from './tree-select-content';

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
		},
		searchValue: {
			type: String,
			default: ''
		},
		searchRegex: RegExp as PropType<RegExp>,
		// 远程搜索时数据已由 loadData 过滤，本地仅高亮
		remote: {
			type: Boolean,
			default: false
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

		const searching = computed(() => !!props.searchValue.trim());

		/**
		 * 进入搜索时沿用列视图的宽度，并限制在 [SEARCH_MIN_WIDTH, SEARCH_MAX_WIDTH]，避免弹层宽度随结果跳动
		 * 默认 flush: 'pre'，此时 DOM 仍是列视图
		 */
		const SEARCH_MIN_WIDTH = 240;
		const SEARCH_MAX_WIDTH = 360;
		const rootRef = ref<HTMLElement>();
		const searchWidth = ref(SEARCH_MIN_WIDTH);
		watch(searching, (v) => {
			if (!v) return;
			const width = rootRef.value?.offsetWidth || 0;
			searchWidth.value = Math.min(Math.max(width, SEARCH_MIN_WIDTH), SEARCH_MAX_WIDTH);
		});

		/**
		 * 搜索结果：扁平列出 label 命中的节点及其完整路径
		 */
		const searchResults = computed(() => {
			if (!searching.value) return [];
			const regex = props.searchRegex;
			const result: { item: TreeData; labels: string[] }[] = [];
			const traverse = (data: TreeData[], labels: string[]) => {
				data.forEach((item) => {
					const label = String(item.label ?? '');
					const next = [...labels, label];
					if (props.remote || !regex || regex.test(label)) {
						result.push({ item, labels: next });
					}
					item.children?.length && traverse(item.children, next);
				});
			};
			traverse(props.data, []);
			return result;
		});

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
			if (item.disabled) return;
			const tree = treeRef.value;
			if (!tree) return;
			tree.setChecked(item, v, !props.checkStrictly);

			sync();
		};

		const renderCheckbox = (item: TreeData, state: { checked: boolean; indeterminate: boolean }) => {
			return (
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
			);
		};

		const renderSearchResults = () => {
			// 依赖 panelTick，勾选后重绘
			void panelTick.value;
			const regex = props.searchRegex;
			return (
				<Scroller
					class="vc-tree-select__search-results"
					style={{ width: `${searchWidth.value}px` }}
					max-height="200px"
				>
					{
						searchResults.value.length
							? searchResults.value.map(({ item, labels }) => {
									const state = getNodeState(item);
									const last = labels.length - 1;
									return (
										<div
											key={item.value}
											class={[
												'vc-tree-select__cascader-item',
												'vc-tree-select__search-item',
												{ 'is-disabled': !!item.disabled }
											]}
											onClick={() => handleLabelClick(!state.checked, item)}
										>
											{renderCheckbox(item, state)}
											<span class="vc-tree-select__cascader-label" title={labels.join(' / ')}>
												{
													labels.map((label, index) => [
														index === last ? renderHighlight(label, regex) : label,
														index !== last ? ' / ' : null
													])
												}
											</span>
										</div>
									);
								})
							: (<div class="vc-tree-select__empty">暂无匹配数据</div>)
					}
				</Scroller>
			);
		};

		return () => {
			return (
				<div ref={rootRef} class="vc-tree-select__cascader">
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
					{searching.value && renderSearchResults()}
					<Scroller
						// @ts-ignore
						vShow={!searching.value}
						class="vc-tree-select__cascader-columns"
						contentClass="vc-tree-select__cascader-columns-content"
					>
						{
							columns.value.map((columnIndex) => {
								const col = rebuildData.value[columnIndex];
								if (!col || !col.length) return null;
								return (
									<div class="vc-tree-select__cascader-column" key={columnIndex}>
										<Scroller height={180} class="vc-tree-select__cascader-column-wrapper">
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
																{ 'is-select': isSelect, 'is-disabled': !!item.disabled }
															]}
															onMouseenter={() => handleHover(item.value, columnIndex)}
															onClick={() => handleLabelClick(!state.checked, item)}
														>
															{renderCheckbox(item, state)}
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
										</Scroller>
									</div>
								);
							})
						}
					</Scroller>
				</div>
			);
		};
	}
});
