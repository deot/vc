import { ColorPicker as ColorPicker$ } from './color-picker.tsx';
import { ColorPickerView } from './picker-view.tsx';
import { Color } from './color';
import './style.scss';

const ColorPicker = Object.assign(ColorPicker$, {
	View: ColorPickerView,
	Color
});

export {
	ColorPicker,
	ColorPickerView,
	Color
};
