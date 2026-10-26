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
	setup(props) {
		const { t } = useLocale();
		const owner = getInstance('select', 'selectId') as any;

		/**
		 * 判断是否所有可选项都已选中
		 */
		const isAllSelected = computed(() => {
			const current = owner.exposed.current.value || [];
			return props.data.every((value: any) => current.includes(value));
		});

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
