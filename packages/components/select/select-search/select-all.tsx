/** @jsxImportSource vue */

import { defineComponent, computed } from 'vue';
import { getInstance } from '@deot/vc-hooks';
import { useLocale } from '../../locale';

const COMPONENT_NAME = 'vc-select-all';

export const SelectAll = defineComponent({
	name: COMPONENT_NAME,
	props: {
		// 可选的值（搜索结果中未禁用的选项）
		data: {
			type: Array,
			default: () => ([])
		}
	},
	emits: ['change'],
	setup(props, { emit }) {
		const { t } = useLocale();
		const owner = getInstance('select', 'selectId') as any;

		/**
		 * 判断是否已全选：所有可选项都已选中，或已选满 max 项且其中有这些项
		 */
		const isAllSelected = computed(() => {
			const current = new Set(owner.exposed.current.value || []);
			return props.data.every((value: any) => current.has(value))
				|| (owner.exposed.isFull.value && props.data.some((value: any) => current.has(value)));
		});

		// 全选按列表顺序补到 max 为止（add 在选满后不再加入）；取消全选移除其中已选的项
		const handleSelectAll = () => {
			const current = owner.exposed.current.value || [];
			const { add, remove } = owner.exposed;

			const isSelected = isAllSelected.value;
			props.data.forEach((value: any) => {
				if (isSelected && current.includes(value)) {
					remove(value);
				} else if (!isSelected && !current.includes(value)) {
					add(value);
				}
			});
			emit('change');
		};

		return () => {
			return (
				<div
					class={[{ 'is-selected': isAllSelected.value }, 'vc-select-all']}
					onClick={handleSelectAll}
				>
					{ t(isAllSelected.value ? 'vc.Select.deselectAll' : 'vc.Select.selectAll') }
				</div>
			);
		};
	}
});
