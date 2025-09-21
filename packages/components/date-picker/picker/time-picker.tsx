/** @jsxImportSource vue */

import { ref, watch, computed, shallowRef, getCurrentInstance } from 'vue';
import { props as timePickerProps, Props } from './time-picker-props';
import { createPicker } from './base';

import { TimePanel, TimeRangePanel } from '../panel';

const COMPONENT_NAME = 'vc-time-picker';
const getPanel = (type: string) => {
	const isRange = type === 'timerange';
	return isRange ? TimeRangePanel : TimePanel;
};

export const TimePicker = createPicker(COMPONENT_NAME, timePickerProps, () => {
	const props = getCurrentInstance()!.props as Props;
	const icon = ref('icon');
	const panel = shallowRef({});
	const panelOptions = computed(() => {
		return {
			disabledTime: props.disabledTime,
			disabledHours: props.disabledHours,
			disabledMinutes: props.disabledMinutes,
			disabledSeconds: props.disabledSeconds,
			filterable: props.filterable,
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
