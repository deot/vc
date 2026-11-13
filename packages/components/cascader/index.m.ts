import { MCascader as Cascader } from './mobile/cascader';
import { MCascaderView } from './mobile/cascader-view';
import { MCascaderPortal } from './mobile/cascader-core';
import './mobile/style.scss';

const open = (options: Record<string, any> = {}) => {
	const { value, modelValue, ...rest } = options;
	const hasModelValue = Object.prototype.hasOwnProperty.call(options, 'modelValue');

	return MCascaderPortal.popup({
		...rest,
		modelValue: hasModelValue ? modelValue : value
	});
};

export const MCascader = Object.assign(Cascader, {
	open,
	View: MCascaderView
});

export {
	MCascaderView
};
