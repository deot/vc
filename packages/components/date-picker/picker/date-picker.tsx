/** @jsxImportSource vue */

import { ref, watch, computed, shallowRef, getCurrentInstance } from 'vue';
import { props as datePickerProps, Props } from './date-picker-props';
import { createPicker } from './base';
import { DatePanel, DateRangePanel, QuarterRangePanel, MonthRangePanel } from '../panel';
import { clearTime } from '../helper/date-utils';
import { isDisabledMonth, isDisabledTime } from '../helper/utils';

const COMPONENT_NAME = 'vc-date-picker';

const getPanel = (type: string) => {
	if (['daterange', 'datetimerange'].includes(type)) {
		return DateRangePanel;
	} else if (type === 'quarterrange') {
		return QuarterRangePanel;
	} else if (type === 'monthrange') {
		return MonthRangePanel;
	}
	return DatePanel;
};

export const DatePicker = createPicker(COMPONENT_NAME, datePickerProps, () => {
	const props = getCurrentInstance()!.props as Props;
	const icon = ref('date');
	const panel = shallowRef({});
	const panelOptions = computed(() => {
		return {
			disabledDate: props.disabledDate!,
			shortcuts: props.shortcuts,
			timePickerOptions: props.timePickerOptions,
		};
	});

	// 键入的值是否被禁用，与面板上的单元格一致：日期按当天判断（带时间的类型还要看时间列），月份只要有一天被禁用即禁用，年份不判断
	const isDisabled = (date: Date) => {
		const disabledDate = props.disabledDate as ((date: Date) => boolean) | undefined;
		if (props.type.includes('datetime') && isDisabledTime(date, props.timePickerOptions)) return true;
		if (typeof disabledDate !== 'function' || props.type === 'year') return false;
		if (props.type.includes('month')) return isDisabledMonth(date.getFullYear(), date.getMonth(), disabledDate);
		return !!disabledDate(clearTime(date));
	};

	watch(
		() => props.type,
		(v) => {
			panel.value = getPanel(v);
		},
		{ immediate: true }
	);

	return {
		icon,
		panel,
		panelOptions,
		isDisabled
	};
});
