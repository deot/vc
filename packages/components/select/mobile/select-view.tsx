/** @jsxImportSource vue */

import { computed, defineComponent, inject, nextTick, onMounted, ref, watch } from 'vue';
import { MIcon } from '../../icon/index.m';
import { MInputSearch } from '../../input/index.m';
import { MCustomer } from '../../customer/index.m';
import { useLocale } from '../../locale';
import {
	createSearchRegex,
	flattenData,
	getSelectLabels,
	getSelectRows,
	isMaxReached,
	isMultiple,
	toCurrentValue,
	toModelValue
} from '../utils';
import { renderHighlight } from '../select-search/highlight';
import { scrollToCenter } from '../select-list/scroll';
import { props as selectViewProps } from './select-view-props';
import type { TreeData, TreeValue } from '../utils';

const COMPONENT_NAME = 'vcm-select-view';

/**
 * select 事件的参数：每次点选一项时触发
 */
export interface MSelectSelectPayload {
	row: TreeData;
	value: TreeValue;
	// 点选后该项是否为选中
	selected: boolean;
}

export const MSelectView = defineComponent({
	name: COMPONENT_NAME,
	props: selectViewProps,
	emits: ['update:modelValue', 'change', 'select', 'clear'],
	setup(props, { emit, slots, expose }) {
		const { t } = useLocale();
		const formItem = inject<any>('vc-form-item', {});

		// 选中的值
		const values = ref<TreeValue[]>([]);
		const keyword = ref('');
		const list = ref<HTMLElement>();

		const multiple = computed(() => isMultiple(props.max));
		const selected = computed(() => new Set(values.value));
		const isFull = computed(() => isMaxReached(props.max, values.value.length));

		const regex = computed(() => createSearchRegex(props.searchable ? keyword.value : ''));
		const rows = computed(() => getSelectRows(props.data as TreeData[], regex.value));
		// 铺平的选项（含分组内的），用于查找已选项的文字
		const source = computed(() => flattenData(props.data, { parent: true, cascader: true }));

		const isDisabled = (row: TreeData) => !!row.disabled || (isFull.value && !selected.value.has(row.value));

		// 每次提交都是新数组，回传的值直接解析
		watch(
			() => props.modelValue,
			(v) => {
				values.value = toCurrentValue(v, props);
			},
			{ immediate: true }
		);

		const sync = () => {
			// 发出副本：外部持有的数组与视图内的值互不影响
			const value = toModelValue(values.value.slice(), props);
			const labels = getSelectLabels(values.value, source.value);
			emit('update:modelValue', value, labels);
			emit('change', value, labels);
			props.allowDispatch && formItem?.change?.(value);
		};

		/**
		 * 点选一项：单选时替换（点已选中的项不变）；多选时切换，选满后未选中的项不可点
		 * @param row ~
		 */
		const handleSelect = (row: TreeData) => {
			if (isDisabled(row)) return;
			const has = selected.value.has(row.value);
			if (!multiple.value) {
				if (!has) {
					values.value = [row.value];
					sync();
				}
			} else {
				values.value = has
					? values.value.filter(v => v !== row.value)
					: [...values.value, row.value];
				sync();
			}
			emit('select', { row, value: row.value, selected: multiple.value ? !has : true } as MSelectSelectPayload);
		};

		// 点击列表：按行上的 data-index 找到该项（整个列表一个监听）
		const handleOptionsClick = (e: MouseEvent) => {
			const el = (e.target as Element).closest<HTMLElement>('.vcm-select-view__option');
			const row = el && rows.value[+el.dataset.index!];
			row && !row.group && handleSelect(row.item);
		};

		// 清空：先 clear 再提交空值（同桌面端）
		const clear = () => {
			values.value = [];
			emit('clear');
			sync();
		};

		// 第一个已选项滚到列表中间
		const scrollIntoSelected = () => {
			if (!values.value.length || !list.value) return;
			scrollToCenter(list.value, list.value.querySelector<HTMLElement>('.vcm-select-view__option.is-selected'));
		};

		onMounted(() => nextTick(scrollIntoSelected));

		expose({
			clear,
			scrollIntoSelected
		});

		const renderLabel = (row: TreeData, index: number, isSelected: boolean) => {
			const render = slots.label || props.renderLabel;
			if (render) {
				return (<MCustomer render={render} label={row.label} row={row} index={index} selected={isSelected} />);
			}
			return renderHighlight(row.label ?? row.value, regex.value);
		};

		// rowIndex：在 rows 中的位置，点击时据此找到该项；index：在选项中（不含分组标题）的位置
		const renderOption = (row: TreeData, rowIndex: number, index: number) => {
			const isSelected = selected.value.has(row.value);
			return (
				<div
					key={row.value}
					data-index={rowIndex}
					class={[
						'vcm-select-view__option',
						{ 'is-selected': isSelected, 'is-disabled': isDisabled(row) }
					]}
				>
					<div class="vcm-select-view__content">
						<div class="vcm-select-view__label">{ renderLabel(row, index, isSelected) }</div>
						{
							row.description != null && row.description !== '' && (
								<MCustomer class="vcm-select-view__description" wrap render={row.description} />
							)
						}
					</div>
					{ isSelected && (<MIcon class="vcm-select-view__icon" type="correct" />) }
				</div>
			);
		};

		// 多选：已选数量（及上限）；clearable 且有已选项时右侧「清空」
		const renderSummary = () => {
			const hasClear = props.clearable && values.value.length > 0;
			if (!multiple.value && !hasClear) return null;
			const count = values.value.length;
			return (
				<div class="vcm-select-view__summary">
					<span class="vcm-select-view__count">
						{
							multiple.value && (
								props.max > 0
									? t('vc.Select.selectedMax', { count, max: props.max })
									: t('vc.Select.selected', { count })
							)
						}
					</span>
					{ hasClear && (<span class="vcm-select-view__clear" onClick={clear}>{ t('vc.Select.clearText') }</span>) }
				</div>
			);
		};

		// 分组标题与选项；选项的 index 为它在列表中（不含分组标题）的位置
		const renderRows = () => {
			let index = 0;
			return rows.value.map(({ item, group }, rowIndex) => (
				group
					? (
							<div key={`group:${item.value}`} class="vcm-select-view__group">
								{ item.label ?? item.value }
							</div>
						)
					: renderOption(item, rowIndex, index++)
			));
		};

		return () => {
			return (
				<div class={['vcm-select-view', { 'is-multiple': multiple.value }]}>
					{
						props.searchable && (
							<div class="vcm-select-view__search">
								<MInputSearch
									// placeholder 由 MInputSearch 透传给输入框
									{...(props.searchPlaceholder ? { placeholder: props.searchPlaceholder } : {})}
									modelValue={keyword.value}
									// @ts-ignore
									onUpdate:modelValue={(v: string) => (keyword.value = v)}
								/>
							</div>
						)
					}
					{ renderSummary() }
					<div ref={list} class="vcm-select-view__options" onClick={handleOptionsClick}>
						{
							rows.value.length
								? renderRows()
								: (<div class="vcm-select-view__empty">{ t('vc.Select.noMatch') }</div>)
						}
					</div>
				</div>
			);
		};
	}
});
