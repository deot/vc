import { MDatePicker as DatePicker } from './mobile/date-picker';
import { MDatePickerView } from './mobile/date-picker-view';
import { MDatePickerPortal } from './mobile/date-picker-core';

const open = (options: Record<string, any> = {}) => {
	const { value, modelValue, ...rest } = options;
	const hasModelValue = Object.prototype.hasOwnProperty.call(options, 'modelValue');

	return MDatePickerPortal.popup({
		...rest,
		modelValue: hasModelValue ? modelValue : value
	});
};

export const MDatePicker = Object.assign(DatePicker, {
	open,
	View: MDatePickerView
});

export {
	MDatePickerView
};
