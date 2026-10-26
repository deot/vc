/** @jsxImportSource vue */

import { defineComponent, ref, computed, nextTick } from 'vue';
import { getUid } from '@deot/helper-utils';
import { getLabel, flattenData, getOptionText } from './utils';
import type { TreeData } from './utils';
import { Popover } from '../popover/index';
import { Option, OptionGroup } from './select-option';
import { props as selectProps } from './select-props';
import { SelectAll, SelectSearch } from './select-search';
import { SelectTrigger } from './select-trigger';
import { SelectList } from './select-list';
import type { SelectTag } from './select-trigger';
import { useSelect, useSelectValue, useSelectedCache } from './hooks/use-select';
import { useNavigate } from './hooks/use-navigate';
import { useLocale } from '../locale';

const COMPONENT_NAME = 'vc-select';

// 列表的一行：分组标题或选项
interface SelectRow {
	item: TreeData;
	group?: boolean;
}

// 选项由 Popover 内置的 Scroller 滚动
const scrollerOptions = { maxHeight: 200, wrapperClass: 'vc-select__options' };

export const Select = defineComponent({
	name: COMPONENT_NAME,
	props: selectProps,
	emits: ['ready', 'close', 'visible-change', 'clear', 'change', 'update:modelValue'],
	setup(props, { slots, expose }) {
		const { t } = useLocale();
		const selectId = ref(getUid('select'));

		const select = useSelect('select', { navigator: () => navigate });
		const { its, isActive, searchRegex, searchMode, isSearching, isRemote, close, toggle } = select;
		const { currentValue, multiple, sync: syncValue, handleClear } = useSelectValue(select);

		const source = computed(() => {
			return flattenData(props.data, { parent: true, cascader: true });
		});

		// 已选值的文字；远程搜索时，不在当前结果里的沿用上次查到的
		const getSelected = useSelectedCache<string>(isRemote);
		const currentLabel = computed(() => {
			if (!props.data.length && !isRemote()) {
				return [];
			}

			const labels = getSelected(currentValue.value, v => getLabel(source.value, v));
			return currentValue.value.map(v => labels.get(v) || '');
		});

		const tags = computed(() => {
			return currentValue.value.map((v, index) => ({
				key: v,
				value: v,
				label: currentLabel.value[index] || ''
			}));
		});

		/**
		 * 列表的行：分组标题与选项铺平，按搜索词过滤（filterable 为 false 的选项不参与）；没有命中项的分组不显示
		 */
		const rows = computed<SelectRow[]>(() => {
			const regex = searchRegex.value;
			const match = (item: TreeData) => item.filterable === false || regex.test(getOptionText(item));
			const result: SelectRow[] = [];
			(props.data as TreeData[] || []).forEach((item) => {
				if (!Array.isArray(item.children) || !item.children.length) {
					match(item) && result.push({ item });
					return;
				}
				const children = item.children.filter(match);
				children.length && result.push({ item, group: true }, ...children.map(child => ({ item: child })));
			});
			return result;
		});

		// 搜索结果中可选的值，供全选
		const selectableValues = computed(() => {
			return rows.value.filter(row => !row.group && !row.item.disabled).map(row => row.item.value);
		});
		const showSelectAll = computed(() => {
			return multiple.value && isSearching.value && selectableValues.value.length > 0;
		});
		// 弹层顶部：搜索栏；内联搜索时只在出现全选时显示
		const showHeader = computed(() => {
			return searchMode.value === 'popover' || showSelectAll.value;
		});
		const sync = () => {
			syncValue(currentLabel.value);
		};

		const add = (v: any) => {
			if (!multiple.value) {
				currentValue.value = [v];
				isActive.value = false;
			} else {
				currentValue.value.push(v);
			}

			sync();
		};

		const remove = (v: any) => {
			const index = currentValue.value.findIndex(i => i === v);

			currentValue.value.splice(index, 1);

			sync();
		};

		const handleRemove = (item: SelectTag) => {
			remove(item.value);
		};

		/**
		 * 点击（或回车）一个选项：单选时已选中则关闭，多选时切换
		 * @param v 选项的值
		 */
		const pick = (v: any) => {
			const isChecked = currentValue.value.includes(v);
			if (!multiple.value && isChecked) {
				close();
			} else if (isChecked) {
				remove(v);
			} else {
				add(v);
			}
		};

		// 已选的值：打开时逐项判断是否已选，用 Set 查找
		const selectedValues = computed(() => new Set(currentValue.value));

		// 选项的键盘高亮：打开时为首个已选中的一项（弹层就绪后滚动到它，见 scrollIntoSelected）；搜索词、数据变化后选项增减，为第一项
		// 自定义整个选项（option 插槽、renderOption）时不参与
		const navigate = useNavigate<SelectRow>({
			getList: () => rows.value,
			isEnabled: ({ item, group }) => !group && !item.disabled && !slots.option && !props.renderOption,
			prefer: ({ item }) => selectedValues.value.has(item.value),
			select: ({ item }) => pick(item.value),
			source: rows
		});

		// 打开时高亮的即首个已选项；弹层在 ready 之后才显示（此前为 display: none，无法测量）
		const scrollIntoSelected = () => {
			nextTick(navigate.scrollIntoActive);
		};

		expose({
			selectId,
			add,
			remove,
			pick,
			close,
			multiple,
			isActive,
			current: currentValue,
			// for portal
			toggle
		});

		const renderTrigger = () => {
			return (
				<SelectTrigger
					{...select.trigger.value}
					placeholder={its.value.attrs?.placeholder ?? t('vc.Select.placeholder')}
					label={props.label}
					text={currentLabel.value[0] || props.extra}
					tags={multiple.value ? tags.value : void 0}
					clearable={props.clearable && currentValue.value.length > 0}
					onClear={handleClear}
					onRemove={handleRemove}
				>
					{{ prepend: slots.prepend }}
				</SelectTrigger>
			);
		};

		const renderHeader = () => {
			return (
				<SelectSearch {...select.search.value} input={searchMode.value === 'popover'}>
					{ showSelectAll.value && (<SelectAll data={selectableValues.value} />) }
				</SelectSearch>
			);
		};

		const renderOption = (item: any) => {
			return (
				<Option
					key={item.value}
					row={item}
					value={item.value}
					label={item.label}
					disabled={item.disabled}
					regex={searchRegex.value}
					render={props.renderOption}
					renderLabel={props.renderLabel}
				>
					{{ default: slots?.option, label: slots?.label }}
				</Option>
			);
		};

		const renderGroup = (item: any) => {
			return (
				<OptionGroup
					row={item}
					value={item.value}
					label={item.label}
					key={`group:${item.value}`}
					render={props.renderOptionGroup}
				>
					{{ optionGroup: slots?.optionGroup, label: slots?.label }}
				</OptionGroup>
			);
		};

		const renderRow = ({ row }: { row: SelectRow }) => {
			return row.group ? renderGroup(row.item) : renderOption(row.item);
		};

		const renderContent = () => {
			if (!props.data) return slots?.default?.();
			return (
				<SelectList
					ref={navigate.setList}
					data={rows.value}
					virtualized={props.virtualized}
					onHover={navigate.hover}
				>
					{{ default: renderRow, $stable: true }}
				</SelectList>
			);
		};

		return () => {
			return (
				<Popover
					{...select.popover.value}
					scrollerOptions={scrollerOptions}
					onReady={scrollIntoSelected}
				>
					{{
						default: renderTrigger,
						header: showHeader.value ? renderHeader : undefined,
						content: renderContent
					}}
				</Popover>
			);
		};
	}
});
