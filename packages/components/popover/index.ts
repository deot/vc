import { Popover as Popover$ } from './popover.tsx';
import { PopoverPortal, PopoverView } from './popover-view';
import './style.scss';

export const Popover = Object.assign(Popover$, {
	open: PopoverPortal.popup.bind(PopoverPortal)
});

export { PopoverView };
