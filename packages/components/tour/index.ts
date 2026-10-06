import { Tour as Tour$ } from './tour.tsx';
import { TourStep } from './tour-step.tsx';
import { TourPortal } from './tour-view';
import './style.scss';

export const Tour = Object.assign(Tour$, {
	open: TourPortal.popup.bind(TourPortal),
	destroy: TourPortal.destroy
});

export { TourStep };
