import { Portal } from '../portal';
import { ActionSheet } from './mobile/action-sheet.tsx';
import type { Props } from './mobile/action-sheet-props';
import './mobile/style.scss';

type Options = Partial<Props & { onClose: (...args: any[]) => any }>;

const ActionSheetPortal = new Portal(ActionSheet, {
	leaveDelay: 0,
	multiple: true
});

const popup = (options: Options = {}) => {
	const { onClose, ...rest } = options;

	return ActionSheetPortal.popup({
		...rest,
		onFulfilled: onClose,
		onClose: null
	});
};

const open = popup;
const destroy = () => ActionSheetPortal.destroy();

export const MActionSheet = Object.assign(ActionSheet, {
	open,
	popup,
	destroy
});
