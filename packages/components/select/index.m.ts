import { MSelect as Select } from './mobile/select';
import { MSelectView } from './mobile/select-view';
import { MSelectPortal } from './mobile/select-core';
import './mobile/style.scss';

const open = (options: Record<string, any> = {}) => {
	const { value, modelValue, ...rest } = options;
	const hasModelValue = Object.prototype.hasOwnProperty.call(options, 'modelValue');

	return MSelectPortal.popup({
		...rest,
		modelValue: hasModelValue ? modelValue : value
	});
};

export const MSelect = Object.assign(Select, {
	open,
	View: MSelectView
});

export {
	MSelectView
};
