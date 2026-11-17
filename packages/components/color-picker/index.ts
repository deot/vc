import { ColorPicker as ColorPicker$ } from './color-picker';
import { ColorPickerView } from './color-picker-view';
import { COLORS } from './color-picker-view/constants';
import { Color } from './color';
import './style.scss';

const ColorPicker = Object.assign(ColorPicker$, {
	View: ColorPickerView,
	Color,
	// 内置预设色（colors 为 true 时使用），可在此基础上扩展
	colors: COLORS
});

export {
	ColorPicker,
	ColorPickerView,
	Color
};
