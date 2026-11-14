/** @jsxImportSource vue */

import { defineComponent, ref } from 'vue';
import { Button } from '../../button/index';
import { Checkbox, CheckboxGroup } from '../../checkbox/index';
import { Dropdown } from '../../dropdown/index';
import { Icon } from '../../icon/index';
import { useLocale } from '../../locale';
import { filterProps, filterEmits, useTableFilter } from './use-table-filter';

export type { TableFilterOption, TableFilterOptions } from './use-table-filter';

/**
 * 表头筛选：只做交互，选中值经 change / update:modelValue 交给外部，数据过滤由外部完成
 * 	- 多选（max > 1）：勾选后点「确认」生效，「重置」清空；选满 max 个后其余选项置灰；
 * 	- 单选（max = 1）：点选即生效，「全部」清空。
 */
export const TableFilter = defineComponent({
	name: 'vc-table-filter',
	props: filterProps,
	emits: [...filterEmits],
	setup(props, context) {
		const { t } = useLocale();
		const isVisible = ref(false);
		const {
			multiple,
			currentValue,
			isFiltered,
			handleConfirm,
			handleChange,
			handleVisibleChange,
			handleReset
		} = useTableFilter(props, context, {
			close: () => (isVisible.value = false)
		});

		const renderMultiple = () => {
			// 选满 max 个后，未勾选的选项置灰
			const isFull = currentValue.value.length >= props.max;
			return (
				<CheckboxGroup
					modelValue={currentValue.value}
					class="vc-table-filter__content"
					// @ts-ignore
					onChange={handleChange}
				>
					{
						props.data.map(item => (
							<Checkbox
								key={item.value}
								value={item.value}
								label={item.label}
								disabled={item.disabled || (isFull && !currentValue.value.includes(item.value))}
								class="vc-table-filter__item"
							/>
						))
					}
				</CheckboxGroup>
			);
		};

		// 多选的操作按钮在弹层的固定区，不随选项滚动
		const renderFooter = () => {
			return (
				<div class="vc-table-filter__footer">
					<Button size="small" onClick={handleReset}>
						{ t('vc.Table.filterReset') }
					</Button>
					<Button
						type="primary"
						size="small"
						onClick={handleConfirm}
					>
						{ t('vc.Table.filterConfirm') }
					</Button>
				</div>
			);
		};

		const renderSingle = () => {
			return (
				<div class="vc-table-filter__content">
					<div
						class="vc-table-filter__item"
						onClick={handleReset}
					>
						{ t('vc.Table.filterAll') }
					</div>
					{
						props.data.map(item => (
							<div
								key={item.value}
								class={[
									{
										'is-active': currentValue.value.includes(item.value),
										'is-disabled': item.disabled
									},
									'vc-table-filter__item'
								]}
								onClick={() => !item.disabled && handleChange([item.value])}
							>
								{ item.label }
							</div>
						))
					}
				</div>
			);
		};

		return () => {
			return (
				<Dropdown
					modelValue={isVisible.value}
					trigger="click"
					placement="bottom"
					portalClass={props.portalClass}
					// 选项由弹层内置的 Scroller 限高滚动
					scrollerOptions={{ maxHeight: 160 }}
					class="vc-table-filter vc-drag-ignore"
					// @ts-ignore
					onVisibleChange={handleVisibleChange}
					onUpdate:modelValue={(v: boolean) => (isVisible.value = v)}
				>
					{{
						default: () => (
							<Icon
								type={props.icon || 'filter-solid'}
								class={[{ 'is-active': isFiltered.value }, 'vc-table-filter__icon']}
							/>
						),
						content: () => (multiple.value ? renderMultiple() : renderSingle()),
						footer: multiple.value ? renderFooter : undefined
					}}
				</Dropdown>
			);
		};
	}
});
