/** @jsxImportSource vue */

import { defineComponent, ref, computed, watch } from 'vue';
import type { PropType } from 'vue';
import { renderType } from '../../customer/customer-props';
import { findIndexByValue } from '../../select/utils';
import type { TreeData, TreeValue, SearchRegex } from '../../select/utils';
import { Checkbox } from '../../checkbox/index';
import { Customer } from '../../customer/index';
import { useLocale } from '../../locale';
import { TreeStore, KEY_VALUE } from '../store';
import type { TreeCheckStrategy } from '../types';
import { SelectPaths } from '../../select/select-search';
import type { SelectPath } from '../../select/select-search';
import { CascaderColumns } from '../../cascader/cascader-columns';
import type { CascaderCell } from '../../cascader/cascader-columns';
import { useColumnNavigate } from '../../select/hooks/use-navigate';

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
		checkStrategy: {
			type: String as PropType<TreeCheckStrategy>,
			default: 'all'
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
		},
		// 见 TreeSelect 的 max：为 1 时没有复选框，点项选中
		max: {
			type: Number,
			default: 0
		}
	},
	// select：一次有效的选择（单选时点已选中的项也算），TreeSelect 单选时据此关闭
	emits: ['change', 'select'],
	setup(props, { emit, expose }) {
		const { t } = useLocale();
		const columnsRef = ref<any>();
		// 勾选状态（父子联动）只需要树的 store，不渲染树：节点的状态是响应式的，列与搜索结果的复选框直接读取
		const store = new TreeStore({
			data: props.data,
			keyValue: { ...KEY_VALUE },
			checkStrategy: props.checkStrategy,
			max: props.max,
			checkedValues: [...props.value]
		});
		watch(() => props.value, v => store.setCheckedValues([...v]));
		watch(() => props.data, v => store.setData(v));
		watch(() => props.checkStrategy, (v) => {
			store.checkStrategy = v;
		});
		watch(() => props.max, (v) => {
			store.max = v;
			store.updateFull();
		});

		/**
		 * 节点的路径（各级的值）
		 * @param value ~
		 * @returns 不在数据中时为空
		 */
		const getPath = (value?: TreeValue) => {
			const path: TreeValue[] = [];
			for (let node = value != null ? store.getNode(value) : null; node && node.states.level > 0; node = node.parentNode) {
				path.unshift(node.getter.value);
			}
			return path;
		};

		/** hover 展开路径，与 Cascader 一致；单选时打开即展开到已选的节点 */
		const currentValue = ref<TreeValue[]>(props.max === 1 ? getPath(props.value[0]) : []);
		const rebuildData = computed(() => {
			if (!props.data.length) return [];
			let temp: TreeData[] = props.data;
			const data: TreeData[][] = [];
			currentValue.value.forEach((cur) => {
				const col = temp;
				data.push(col);
				const next = (temp.find(i => i.value === cur) || {}).children || [];
				temp = next;
			});
			data.push(temp);
			return data;
		});
		const searching = computed(() => !!props.searchRegex?.highlight);

		const sync = () => {
			const data = store.getCheckedState();
			// 先记下这次的勾选值：父级随后传回相同的 value 时 setCheckedValues 判断相等直接跳过，不必按它把整棵树再写一遍
			store.checkedValues = data.checkedValues;
			emit('change', null, data);
		};

		const getNodeState = (item: TreeData) => {
			const node = store.getNode(item);
			return {
				checked: !!node?.states.checked,
				indeterminate: !!node?.states.indeterminate
			};
		};

		/**
		 * 切换一项的勾选（复选框、点击级联列的项、选中搜索结果、回车），按 max 与 checkStrategy 写入（见 TreeStore.toggleChecked）
		 * 	- 禁用、单选时不可选、已选满时不处理
		 * 	- 单选时点已选中的项：值不变，只发出 select
		 * @param item ~
		 * @param checked 默认取反；单选时为选中
		 */
		const toggle = (item: TreeData, checked = store.single || !getNodeState(item).checked) => {
			const node = store.getNode(item);
			if (!node) return;
			if (!(store.single && checked && node.states.checked)) {
				if (!store.toggleChecked(node, checked)) return;
				sync();
			}
			emit('select', { item, checked: node.states.checked });
		};

		const renderCheckbox = (item: TreeData) => {
			const state = getNodeState(item);
			const node = store.getNode(item);
			// 不可勾选：禁用；已选满时未勾选（含半选）的项
			const disabled = !!item.disabled || (!!node && !state.checked && store.full);
			return (
				<span
					class="vc-tree-select__cascader-checkbox"
					onClick={(e: MouseEvent) => e.stopPropagation()}
				>
					<Checkbox
						modelValue={state.checked}
						indeterminate={state.indeterminate}
						disabled={disabled}
						// 写入被拒绝（已选满、超过上限）后，复选框按节点的实际状态复原
						onChange={(v: any, _: Event, reset?: (checked: boolean) => void) => {
							toggle(item, !!v);
							const actual = getNodeState(item).checked;
							actual !== !!v && reset?.(actual);
						}}
					/>
				</span>
			);
		};

		// 选中搜索结果 / 点击级联列的项：切换勾选
		const handleSelect = ({ item }: SelectPath | CascaderCell) => toggle(item);

		const renderPrefix = ({ item }: SelectPath | CascaderCell) => renderCheckbox(item);

		// 单选：选中的项以主色标出（样式见 tree-select.scss）
		const renderLabel = ({ item }: CascaderCell) => {
			const node = store.getNode(item);
			const label = props.renderNodeLabel && node
				? (<Customer render={props.renderNodeLabel} store={node} row={item} />)
				: item.label;
			return store.single && node?.states.checked
				? (<span class="vc-tree-select__cascader-label is-checked">{ label }</span>)
				: label;
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
				const list = rebuildData.value[index];
				const item = list?.[findIndexByValue(list, currentValue.value[index])];
				item && toggle(item);
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
								{{ prefix: store.single ? void 0 : renderPrefix }}
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
						{{ prefix: store.single ? void 0 : renderPrefix, label: renderLabel }}
					</CascaderColumns>
				</div>
			);
		};
	}
});
