import { MCascader as Cascader } from './mobile/cascader';
import { MCascaderView } from './mobile/cascader-view';
import { MCascaderPortal } from './mobile/cascader-core';
import { createPickerOpen } from '../picker/mobile/use-picker-portal';
import './mobile/style.scss';

const open = createPickerOpen(MCascaderPortal);

export const MCascader = Object.assign(Cascader, {
	open,
	View: MCascaderView
});

export {
	MCascaderView
};
