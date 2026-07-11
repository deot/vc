/** @jsxImportSource vue */

import { computed, defineComponent, inject, ref, watch } from 'vue';
import { isEqualWith } from 'lodash-es';
import { MPickerView } from '../../picker/index.m';
import { props as datePickerViewProps } from './date-picker-view-props';
import {
	dateToPickerValue,
	formatDatesToModelValue,
	getDefaultDate,
	getPickerUnits,
	makeColumn,
	parseModelValueToDates,
	pickerValueToDates,
	type PickerUnit
} from './utils';
import type { PickerColumn, PickerValue } from '../../picker/types';

const COMPONENT_NAME = 'vcm-date-picker-view';
const FULL_DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export const MDatePickerView = defineComponent({
	name: COMPONENT_NAME,
	props: datePickerViewProps,
	emits: ['update:modelValue', 'change', 'picker-change'],
	setup(props, { emit }) {
		const formItem = inject<any>('vc-form-item', {});
		const currentValue = ref<PickerValue[]>([]);
		const rebuildData = ref<PickerColumn[]>([]);

		const units = computed(() => getPickerUnits(props.type, props.format));
		const cols = computed(() => units.value.length);

		const getPartMap = (date: Date) => {
			const values = dateToPickerValue(date, 'datetime', FULL_DATETIME_FORMAT);
			return {
				Y: values[0],
				M: values[1],
				D: values[2],
				H: values[3],
				m: values[4],
				s: values[5]
			} as Record<PickerUnit, PickerValue>;
		};

		const compareBoundary = (date: Date, targetUnits: PickerUnit[]) => {
			const partMap = getPartMap(date);
			return targetUnits.every((unit) => {
				const index = units.value.indexOf(unit);
				return index < 0 || currentValue.value[index] == partMap[unit];
			});
		};

		const getRange = (unit: PickerUnit) => {
			const min = getPartMap(props.minDate);
			const max = getPartMap(props.maxDate);
			const currentYear = Number(currentValue.value[units.value.indexOf('Y')]) || new Date().getFullYear();
			const currentMonth = Number(currentValue.value[units.value.indexOf('M')]) || 1;

			switch (unit) {
				case 'Y':
					return [Number(min.Y), Number(max.Y)];
				case 'M':
					return [
						compareBoundary(props.minDate, ['Y']) ? Number(min.M) : 1,
						compareBoundary(props.maxDate, ['Y']) ? Number(max.M) : 12
					];
				case 'D':
					return [
						compareBoundary(props.minDate, ['Y', 'M']) ? Number(min.D) : 1,
						compareBoundary(props.maxDate, ['Y', 'M']) ? Number(max.D) : getMonthEndDaySafe(currentYear, currentMonth)
					];
				case 'H':
					if (props.type === 'time') {
						return [props.startHour, props.endHour];
					}
					return [
						compareBoundary(props.minDate, ['Y', 'M', 'D']) ? Number(min.H) : 0,
						compareBoundary(props.maxDate, ['Y', 'M', 'D']) ? Number(max.H) : 23
					];
				case 'm':
					if (props.type === 'time') return [0, 59];
					return [
						compareBoundary(props.minDate, ['Y', 'M', 'D', 'H']) ? Number(min.m) : 0,
						compareBoundary(props.maxDate, ['Y', 'M', 'D', 'H']) ? Number(max.m) : 59
					];
				case 's':
					if (props.type === 'time') return [0, 59];
					return [
						compareBoundary(props.minDate, ['Y', 'M', 'D', 'H', 'm']) ? Number(min.s) : 0,
						compareBoundary(props.maxDate, ['Y', 'M', 'D', 'H', 'm']) ? Number(max.s) : 59
					];
				case 'Q':
					return [1, 4];
				default:
					return [0, 0];
			}
		};

		const makeRebuildData = () => {
			return units.value.map((unit) => {
				const [start, end] = getRange(unit);
				return makeColumn(unit, start, end);
			});
		};

		const normalizeCurrentValue = () => {
			const next = currentValue.value.slice(0, cols.value);

			rebuildData.value.forEach((column, index) => {
				const target = column.find(row => row.value == next[index]) || column[0];
				if (target) {
					next.splice(index, 1, target.value);
				} else {
					next.splice(index, 1);
				}
			});

			if (isEqualWith(next, currentValue.value)) return false;
			currentValue.value = next;
			return true;
		};

		const rebuild = () => {
			for (let i = 0; i <= cols.value; i++) {
				rebuildData.value = makeRebuildData();
				if (!normalizeCurrentValue()) return;
			}

			rebuildData.value = makeRebuildData();
		};

		const setValue = (value: any) => {
			const dates = parseModelValueToDates(value, props.type, props.format);
			const date = dates[0] || getDefaultDate(props.minDate, props.maxDate);

			currentValue.value = dateToPickerValue(date, props.type, props.format);
			rebuild();
		};

		const sync = () => {
			const dates = pickerValueToDates(
				currentValue.value,
				props.type,
				props.format,
				props.minDate,
				props.maxDate
			);
			const modelValue = formatDatesToModelValue(dates, props.type, props.format, props.nullValue);

			emit('update:modelValue', modelValue);
			emit('change', modelValue);

			props.allowDispatch && formItem?.change?.(modelValue);
		};

		const handlePickerChange = (value: PickerValue, index: number, row: any) => {
			currentValue.value.splice(index, 1, value);
			rebuild();

			emit('picker-change', value, index, row);
			sync();
		};

		watch(
			() => props.modelValue,
			(v) => {
				setValue(v);
			},
			{ immediate: true, deep: true }
		);

		watch(
			() => [
				props.type,
				props.format,
				props.minDate,
				props.maxDate,
				props.startHour,
				props.endHour
			],
			() => {
				setValue(props.modelValue);
			}
		);

		return () => {
			return (
				<MPickerView
					modelValue={currentValue.value}
					data={rebuildData.value}
					cols={cols.value}
					cascader={false}
					allowDispatch={false}
					{...{
						'onPicker-change': handlePickerChange
					}}
				/>
			);
		};
	}
});

const getMonthEndDaySafe = (year: number, month: number) => {
	if (month === 4 || month === 6 || month === 9 || month === 11) return 30;
	if (month === 2) {
		return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28;
	}
	return 31;
};
