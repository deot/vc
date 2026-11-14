import { MTree } from './mobile/tree.tsx';
import { MTreeSelect as TreeSelect } from './mobile/tree-select/tree-select.tsx';
import { MTreeSelectPortal } from './mobile/tree-select/tree-select-core.tsx';
import { createPickerOpen } from '../picker/mobile/use-picker-portal';
import './style.scss';
import './mobile/style.scss';

const open = createPickerOpen(MTreeSelectPortal);

export const MTreeSelect = Object.assign(TreeSelect, {
	open
});

export {
	MTree
};
