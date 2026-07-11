import { Picker } from './mobile/picker.tsx';
import { PickerPopup } from './mobile/picker-popup.tsx';
import { PickerView } from './mobile/picker-view.tsx';
import { PickerPortal } from './mobile/picker-core';
import './mobile/style.scss';

export const open = (options: Record<string, any> = {}) => {
	const { value, modelValue, ...rest } = options;
	const hasModelValue = Object.prototype.hasOwnProperty.call(options, 'modelValue');

	return PickerPortal.popup({
		...rest,
		modelValue: hasModelValue ? modelValue : value
	});
};

export const MPicker = Object.assign(Picker, {
	open,
	View: PickerView,
	Popup: PickerPopup
});

export const MPickerView = PickerView;
export const MPickerPopup = PickerPopup;
