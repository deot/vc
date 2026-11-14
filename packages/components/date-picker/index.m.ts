import { MDatePicker as DatePicker } from './mobile/date-picker';
import { MDatePickerView } from './mobile/date-picker-view';
import { MDatePickerPortal } from './mobile/date-picker-core';
import { createPickerOpen } from '../picker/mobile/use-picker-portal';
import './mobile/style.scss';

const open = createPickerOpen(MDatePickerPortal);

export const MDatePicker = Object.assign(DatePicker, {
	open,
	View: MDatePickerView
});

export {
	MDatePickerView
};
