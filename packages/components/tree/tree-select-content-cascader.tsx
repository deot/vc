/** @jsxImportSource vue */

import { defineComponent, ref, computed, nextTick, watch } from 'vue';
import type { PropType } from 'vue';
import { renderType } from '../customer/customer-props';
import type { TreeData, TreeValue, SearchRegex } from '../select/utils';
import { Checkbox } from '../checkbox/index';
import { Customer } from '../customer/index';
import { useLocale } from '../locale';
import { TreeStore, KEY_VALUE } from './store';
import { SelectPaths } from '../select/select-search';
import type { SelectPath } from '../select/select-search';
import { CascaderColumns } from '../cascader/cascader-columns';
import type { CascaderCell } from '../cascader/cascader-columns';
import { useColumnNavigate } from '../select/hooks/use-navigate';

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
		renderNodeLabel: renderType,
		searchRegex: RegExp as PropType<SearchRegex>,
		// 远程搜索时数据已由 loadData 过滤，本地仅高亮
		remote: {
			type: Boolean,
			default: false
		},
		// 向左展开，见 useColumnDirection
		inverted: {
			type: Boolean,
			default: false
		},
		// 只渲染视口附近的项与搜索结果，见 SelectList
		virtualized: {
			type: Boolean,
			default: false
		}
	},
	emits: ['change'],
	setup(props, { emit, expose }) {
		const { t } = useLocale();
		const columnsRef = ref<any>();
		// 勾选状态（父子联动）只需要树的 store，不渲染树：节点的状态是响应式的，列与搜索结果的复选框直接读取
		const store = new TreeStore({
			data: props.data,
			keyValue: { ...KEY_VALUE },
			checkStrictly: props.checkStrictly,
			checkedValues: [...props.value]
		});
		watch(() => props.value, v => store.setCheckedValues([...v]));
		watch(() => props.data, v => store.setData(v));
		watch(() => props.checkStrictly, (v) => {
			store.checkStrictly = v;
		});
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
		const searching = computed(() => !!props.searchRegex?.highlight);

		const sync = async () => {
			await nextTick();
			emit('change', null, {
				checkedNodes: store.getCheckedNodes(),
				checkedValues: store.getCheckedValues(),
				halfCheckedNodes: store.getHalfCheckedNodes(),
				halfCheckedValues: store.getHalfCheckedValues()
			});
		};

		const getNodeState = (item: TreeData) => {
			const node = store.getNode(item);
			return {
				checked: !!node?.states.checked,
				indeterminate: !!node?.states.indeterminate
			};
		};

		const handleCheckboxChange = (v: any, item: TreeData) => {
			store.setChecked(item, v, !props.checkStrictly);
			sync();
		};

		const handleLabelClick = (v: any, item: TreeData) => {
			if (item.disabled) return;
			store.setChecked(item, v, !props.checkStrictly);
			sync();
		};

		const renderCheckbox = (item: TreeData) => {
			const state = getNodeState(item);
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

		// 选中搜索结果 / 点击级联列的项：切换勾选
		const handleSelect = ({ item }: SelectPath | CascaderCell) => {
			handleLabelClick(!getNodeState(item).checked, item);
		};

		const renderPrefix = ({ item }: SelectPath | CascaderCell) => renderCheckbox(item);

		const renderLabel = ({ item }: CascaderCell) => {
			const node = props.renderNodeLabel && store.getNode(item);
			return node
				? (<Customer render={props.renderNodeLabel} store={node} row={item} />)
				: item.label;
		};

		// 方向键：搜索时在结果列表内移动，否则在级联列内移动（等同鼠标移入）
		const { paths, searchWidth, navigator, handleMove } = useColumnNavigate({
			getPath: () => currentValue.value,
			getColumns: () => rebuildData.value,
			hover: (item, columnIndex) => {
				currentValue.value.splice(columnIndex, currentValue.value.length - columnIndex, item.value);
			},
			scrollTo: (columnIndex, rowIndex) => columnsRef.value?.scrollToItem(columnIndex, rowIndex),
			// 回车：切换路径末端一项的勾选
			enter: () => {
				const index = currentValue.value.length - 1;
				const item = rebuildData.value[index]?.find(i => i.value === currentValue.value[index]);
				item && handleLabelClick(!getNodeState(item).checked, item);
			},
			isSearching: () => searching.value,
			getView: () => columnsRef.value?.$el,
			isInverted: () => props.inverted
		});

		expose(navigator);

		return () => {
			return (
				<div class="vc-tree-select__cascader">
					{
						searching.value && (
							<SelectPaths
								ref={paths}
								data={props.data}
								regex={props.searchRegex}
								remote={props.remote}
								width={searchWidth.value}
								virtualized={props.virtualized}
								emptyText={t('vc.TreeSelect.noMatch')}
								onSelect={handleSelect}
							>
								{{ prefix: renderPrefix }}
							</SelectPaths>
						)
					}
					<CascaderColumns
						ref={columnsRef}
						// @ts-ignore
						vShow={!searching.value}
						class="vc-tree-select__cascader-columns"
						data={rebuildData.value}
						value={currentValue.value}
						inverted={props.inverted}
						virtualized={props.virtualized}
						onMove={handleMove}
						onClick={handleSelect}
					>
						{{ prefix: renderPrefix, label: renderLabel }}
					</CascaderColumns>
				</div>
			);
		};
	}
});
