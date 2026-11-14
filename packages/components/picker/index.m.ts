import { Picker } from './mobile/picker.tsx';
import { PickerPopup } from './mobile/picker-popup.tsx';
import { PickerView } from './mobile/picker-view.tsx';
import { PickerPortal } from './mobile/picker-core';
import { createPickerOpen } from './mobile/use-picker-portal';
import './mobile/style.scss';

export const open = createPickerOpen(PickerPortal);

export const MPicker = Object.assign(Picker, {
	open,
	View: PickerView,
	Popup: PickerPopup
});

export const MPickerView = PickerView;
export const MPickerPopup = PickerPopup;
