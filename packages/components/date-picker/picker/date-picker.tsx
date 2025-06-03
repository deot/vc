/** @jsxImportSource vue */

import { ref, watch, computed, shallowRef, getCurrentInstance } from 'vue';
import { props as datePickerProps, Props } from './date-picker-props';
import { createPicker } from './base';
import { DatePanel, DateRangePanel, QuarterRangePanel, MonthRangePanel } from '../panel';

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

export const DatePicker = createPicker(datePickerProps, () => {
	const props = getCurrentInstance()!.props as Props;
	const icon = ref('date');
	const panel = shallowRef({});
	const panelOptions = computed(() => {
		return {
			...props.options,
			timePickerOptions: props.timePickerOptions
		};
	});

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
	};
});
