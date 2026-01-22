/** @jsxImportSource vue */

import { defineComponent, computed } from 'vue';
import { getInstance } from '@deot/vc-hooks';

const COMPONENT_NAME = 'vc-select-all';

export const SelectAll = defineComponent({
	name: COMPONENT_NAME,
	props: {
		data: {
			type: Array,
			default: () => ([])
		}
	},
	setup(props) {
		const owner = getInstance('select', 'selectId') as any;

		/**
		 * 获取所有可选择的选项（排除disabled的）
		 */
		const selectableOptions = computed(() => {
			return props.data.filter((option: any) => {
				if (!option.isActive || option.props.disabled) return false;
				return true;
			});
		});

		/**
		 * 获取所有可选项的值
		 */
		const selectableValues = computed(() => {
			return selectableOptions.value.map((option: any) => option.props.value);
		});

		/**
		 * 判断是否所有可选项都已选中
		 */
		const isAllSelected = computed(() => {
			if (!owner?.exposed || selectableValues.value.length === 0) {
				return false;
			}
			const current = owner.exposed.current.value || [];
			return selectableValues.value.every((value: any) => current.includes(value));
		});

		const handleSelectAll = () => {
			if (!owner?.exposed) return;

			const current = owner.exposed.current.value || [];
			const { add, remove } = owner.exposed;

			const isSelected = isAllSelected.value;
			selectableValues.value.forEach((value: any) => {
				if (isSelected && current.includes(value)) {
					remove(value);
				} else if (!isSelected && !current.includes(value)) {
					add(value);
				}
			});
		};

		return () => {
			// 如果没有可选项，不显示按钮
			if (selectableOptions.value.length === 0) {
				return null;
			}

			return (
				<div
					class={[{ 'is-selected': isAllSelected.value }, 'vc-select-all']}
					onClick={handleSelectAll}
				>
					{ isAllSelected.value ? '取消全选' : '全选' }
				</div>
			);
		};
	}
});
