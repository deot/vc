/** @jsxImportSource vue */

import { defineComponent, computed, onBeforeUnmount } from 'vue';
import { Icon } from '../../icon/index';
import { useLocale } from '../../locale';
import { MSelect } from '../../select/index.m';
import { filterProps, filterEmits, useTableFilter } from '../table-header/use-table-filter';

const COMPONENT_NAME = 'vcm-table-filter';

// 单选时列表第一项「全部」的值：选中它即清空筛选
const ALL = '__vc_table_filter_all__';

/**
 * 移动端的表头筛选：点图标从底部弹出选项（MSelect.open），取值规则同 TableFilter
 * 	- 多选（max > 1）：勾选后点「确定」生效，「清空」后确定即取消筛选；
 * 	- 单选（max = 1）：点选即生效，第一项「全部」清空。
 */
export const MTableFilter = defineComponent({
	name: COMPONENT_NAME,
	props: {
		...filterProps,
		// 弹层的标题，表头传入列的 label
		title: String
	},
	emits: [...filterEmits],
	setup(props, context) {
		const { t } = useLocale();
		const { multiple, appliedValue, isFiltered, apply } = useTableFilter(props, context);

		const data = computed(() => {
			return multiple.value
				? props.data
				: [{ label: t('vc.Table.filterAll'), value: ALL }, ...props.data];
		});

		let leaf: ReturnType<typeof MSelect.open> | undefined;
		const handleClick = () => {
			const value = appliedValue.value;
			leaf = MSelect.open({
				title: props.title,
				data: data.value,
				max: props.max,
				// 弹层内以数组编辑，输出的形态由 useTableFilter 按外部的 modelValue 还原
				modelValue: multiple.value || value.length ? [...value] : [ALL],
				clearable: multiple.value,
				confirm: multiple.value ? 'bottom' : false,
				onOk: (v: unknown[]) => apply((v || []).filter(item => item !== ALL))
			});
		};

		onBeforeUnmount(() => leaf?.destroy?.());

		return () => {
			return (
				<span class="vc-table-filter vcm-table-filter vc-drag-ignore" onClick={handleClick}>
					<Icon
						type={props.icon || 'filter-solid'}
						class={[{ 'is-active': isFiltered.value }, 'vc-table-filter__icon']}
					/>
				</span>
			);
		};
	}
});
