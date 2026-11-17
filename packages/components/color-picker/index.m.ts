import { MColorPicker as ColorPicker } from './mobile/color-picker';
import { MColorPickerView } from './mobile/color-picker-view';
import { MColorPickerPortal } from './mobile/color-picker-core';
import { COLORS } from './color-picker-view/constants';
import { Color } from './color';
import { createPickerOpen } from '../picker/mobile/use-picker-portal';
import './style.scss';
import './mobile/style.scss';

const open = createPickerOpen(MColorPickerPortal);

export const MColorPicker = Object.assign(ColorPicker, {
	open,
	View: MColorPickerView,
	Color,
	// 内置预设色（colors 为 true 时使用），同 ColorPicker.colors
	colors: COLORS
});

export {
	MColorPickerView
};
