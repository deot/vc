/** @jsxImportSource vue */

import { computed, defineComponent, inject, ref, watch } from 'vue';
import { isEqualWith } from 'lodash-es';
import { toCurrentValue, toModelValue } from '../../select/utils';
import { props as pickerViewProps } from './picker-view-props';
import { PickerCol } from './picker-col';
import { getSelectedData, isColumnGroup, makeColumnData } from './utils';
import type { PickerColumn, PickerData, PickerModelValue, PickerValue } from '../types';

const COMPONENT_NAME = 'vcm-picker-view';

export const PickerView = defineComponent({
	name: COMPONENT_NAME,
	props: pickerViewProps,
	emits: ['update:modelValue', 'change', 'picker-change'],
	setup(props, { emit }) {
		const formItem = inject<any>('vc-form-item', {});
		const currentValue = ref<PickerValue[]>([]);
		const rebuildData = ref<PickerColumn[]>([]);

		const source = computed(() => props.data || []);
		const colCount = computed(() => Math.max(props.cols || 1, 1));

		const makePlainColumns = () => {
			const currentSource = source.value;
			const columns = isColumnGroup(currentSource)
				? currentSource as PickerColumn[]
				: [currentSource as PickerColumn];

			return columns.slice(0, colCount.value).map(column => makeColumnData(column));
		};

		const makeRebuildData = (colIndex = 0) => {
			if (!source.value.length) return [];
			if (!props.cascader || colCount.value === 1) return makePlainColumns().slice(colIndex);

			let temp = source.value as PickerColumn;
			const data: PickerColumn[] = [];
			for (let index = 0; index < colCount.value; index++) {
				data[index] = makeColumnData(temp);

				const target = (
					temp.find(i => i.value == currentValue.value[index])
					|| temp[0]
					|| {}
				) as PickerData;

				temp = target.children || [];
			}

			return data.slice(colIndex);
		};

		const resetDefault = (colIndex = 0) => {
			const next = currentValue.value.slice(0);

			rebuildData.value.forEach((item, index) => {
				if (index < colIndex) return;

				const target = item.find(row => row.value == next[index]) || item[0];
				if (target) {
					next.splice(index, 1, target.value);
				} else {
					next.splice(index, 1);
				}
			});

			currentValue.value = next.slice(0, colCount.value);
		};

		const sync = () => {
			const { label, data } = getSelectedData(currentValue.value, source.value);
			const value = toModelValue(currentValue.value.slice(0) as any, {
				modelValue: props.modelValue as any,
				numerable: props.numerable,
				separator: props.separator,
				nullValue: props.nullValue,
				max: props.cols
			}) as PickerModelValue;

			emit('update:modelValue', value, label, data);
			emit('change', value, label, data);

			props.allowDispatch && formItem?.change?.(value);
		};

		const handleColChange = (row: PickerData, index: number) => {
			currentValue.value.splice(index, 1, row.value);

			if (props.cascader && index < colCount.value - 1) {
				currentValue.value.splice(index + 1, colCount.value - index);
				rebuildData.value.splice(index + 1, colCount.value - index, ...makeRebuildData(index + 1));
				resetDefault(index + 1);
			}

			emit('picker-change', row.value, index, row);
			sync();
		};

		watch(
			() => [props.data, props.cols, props.cascader],
			() => {
				rebuildData.value = makeRebuildData();
				resetDefault();
			},
			{ deep: true }
		);

		watch(
			() => props.modelValue,
			(v) => {
				const next = toCurrentValue(v as any, {
					numerable: props.numerable,
					separator: props.separator
				}) as PickerValue[];
				if (next.length !== 0 && isEqualWith(next, currentValue.value)) return;

				currentValue.value = next;
				rebuildData.value = makeRebuildData();
				resetDefault();
			},
			{ immediate: true, deep: true }
		);

		return () => {
			return (
				<div class="vcm-picker-view">
					{
						Array.from({ length: colCount.value }).map((_, index) => (
							<PickerCol
								key={index}
								index={index}
								data={rebuildData.value[index] || []}
								value={currentValue.value[index]}
								itemStyle={props.itemStyle}
								renderLabel={props.renderLabel}
								onChange={(v: PickerData) => handleColChange(v, index)}
							/>
						))
					}
				</div>
			);
		};
	}
});
