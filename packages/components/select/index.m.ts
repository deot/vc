import { MSelect as Select } from './mobile/select';
import { MSelectView } from './mobile/select-view';
import { MSelectPortal } from './mobile/select-core';
import { createPickerOpen } from '../picker/mobile/use-picker-portal';
import './mobile/style.scss';

const open = createPickerOpen(MSelectPortal);

export const MSelect = Object.assign(Select, {
	open,
	View: MSelectView
});

export {
	MSelectView
};
