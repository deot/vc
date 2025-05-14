import { Popover as Popover$ } from './popover.tsx';
import { PopoverPortal } from './wrapper';
import './style.scss';

export const Popover = Object.assign(Popover$, {
	open: PopoverPortal.popup.bind(PopoverPortal)
});
