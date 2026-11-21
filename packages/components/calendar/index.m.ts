import { MCalendarPicker as CalendarPicker } from './mobile/calendar-picker';
import { MCalendarPickerView } from './mobile/calendar-picker-view';
import { MCalendarPickerPortal } from './mobile/calendar-picker-core';
import { createPickerOpen } from '../picker/mobile/use-picker-portal';
import './style.scss';
import './mobile/style.scss';

export { MCalendar } from './mobile/calendar';

const open = createPickerOpen(MCalendarPickerPortal);

export const MCalendarPicker = Object.assign(CalendarPicker, {
	open,
	View: MCalendarPickerView
});

export {
	MCalendarPickerView
};
