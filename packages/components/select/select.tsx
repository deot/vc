/** @jsxImportSource vue */

import { defineComponent, ref, computed } from 'vue';
import { getUid } from '@deot/helper-utils';
import { getLabel, flattenData } from './utils';
import { Popover } from '../popover/index';
import { Option, OptionGroup } from './select-option';
import { props as selectProps } from './select-props';
import { SelectAll, SelectSearch } from './select-search';
import { SelectTrigger } from './select-trigger';
import { keepFocus } from '../popover/utils';
import type { SelectTag } from './select-trigger';
import { useSelect, useSelectValue, useSelectedCache } from './hooks/use-select';
import { useNavigate } from './hooks/use-navigate';
import { useLocale } from '../locale';

const COMPONENT_NAME = 'vc-select';

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
		const { its, isActive, searchValue, searchRegex, searchMode, isSearching, isRemote, close, toggle } = select;
		const { currentValue, multiple, sync: syncValue, handleClear } = useSelectValue(select);

		// 选项的键盘高亮：打开时为已选中的一项；搜索词、数据变化后选项增减，为第一项
		const navigate = useNavigate({
			selector: '.vc-select-option:not([disabled])',
			prefer: '.is-select',
			source: () => [searchValue.value, props.data]
		});

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

		const optionMap = ref<any>({});
		const options = computed(() => {
			return Object.values(optionMap.value);
		});
		const showSelectAll = computed(() => {
			return multiple.value && isSearching.value && options.value.length > 0;
		});
		// 弹层顶部：搜索栏；内联搜索时只在出现全选时显示
		const showHeader = computed(() => {
			return searchMode.value === 'popover' || showSelectAll.value;
		});
		const setOption = (item: any, el: any) => {
			if (el) {
				optionMap.value[item.value] = el;
			} else {
				delete optionMap.value[item.value];
			}
		};

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

		expose({
			selectId,
			add,
			remove,
			close,
			searchRegex,
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

		// Popover 的插槽在浮层打开时取定：始终提供 header，不需要时不渲染内容
		const renderHeader = () => {
			return showHeader.value && (
				<SelectSearch {...select.search.value} input={searchMode.value === 'popover'}>
					{ showSelectAll.value && (<SelectAll data={options.value} />) }
				</SelectSearch>
			);
		};

		const renderOption = (item: any) => {
			return (
				<Option
					ref={el => setOption(item, el)}
					key={item.value}
					row={item}
					value={item.value}
					label={item.label}
					disabled={item.disabled}
					filterable={item.filterable}
					render={props.renderOption}
					renderLabel={props.renderLabel}
				>
					{{ default: slots?.option, label: slots?.label }}
				</Option>
			);
		};

		const renderItem = (item: any) => {
			if (!Array.isArray(item.children) || !item.children.length) return renderOption(item);
			return (
				<OptionGroup
					row={item}
					value={item.value}
					label={item.label}
					key={item.value}
					render={props.renderOptionGroup}
				>
					{{
						optionGroup: slots?.optionGroup,
						label: slots?.label,
						default: () => item.children.map(renderOption)
					}}
				</OptionGroup>
			);
		};

		// 点击选项时焦点留在搜索输入框
		const renderContent = () => {
			return (
				<div
					ref={navigate.setRoot}
					onMousedown={keepFocus}
					onMouseover={navigate.handleMouseover}
				>
					{ props.data ? props.data.map(renderItem) : slots?.default?.() }
				</div>
			);
		};

		return () => {
			return (
				<Popover
					{...select.popover.value}
					scrollerOptions={scrollerOptions}
				>
					{{
						default: renderTrigger,
						header: renderHeader,
						content: renderContent
					}}
				</Popover>
			);
		};
	}
});
