import type { Slots } from 'vue';
import type { Props as ButtonProps } from '../button/button-props';
import type { Props as StepProps } from './tour-step-props';

export type TourPlacement = 'top' | 'top-left' | 'top-right'
	| 'bottom' | 'bottom-left' | 'bottom-right'
	| 'left' | 'left-top' | 'left-bottom'
	| 'right' | 'right-top' | 'right-bottom';

export type TourAction = 'previous' | 'next' | 'finish' | 'skip';

export type TourEndType = 'finish' | 'skip' | 'close';

export type TourSource = 'button' | 'keyboard' | 'element' | 'mask' | 'esc' | 'api' | 'model' | 'replace';

export interface TourContext {
	current: number;
	total: number;
	step: Record<string, any>;
	element: HTMLElement | null;
}

export interface TourEndContext extends TourContext {
	type: TourEndType;
	source: TourSource;
}

export interface TourActionContext extends TourContext {
	next: number | null;
	source: TourSource;
}

export type TourButtonOptions = Partial<ButtonProps> & {
	onClick?: (event: Event | undefined, context: TourActionContext) => any;
	[key: string]: any;
};

export type TourStepOptions = Partial<StepProps> & {
	slots?: Slots;
	onClose?: (context: TourEndContext) => any;
};

export interface TourConfig {
	cache?: boolean;
	cacheTypes?: TourEndType[];
	getCache?: (context: { cacheKey: string }) => any;
	setCache?: (context: { cacheKey: string; type: TourEndType }) => any;
	onOpen?: (context: { cacheKey?: string; steps: TourStepOptions[] }) => any;
}

// TourStep 向 Tour 登记的声明
export interface TourStepDeclaration {
	options: StepProps;
	slots: Slots;
	onClose: (context: TourEndContext) => void;
	getNode: () => Node | null;
}

export interface TourProvide {
	add: (step: TourStepDeclaration) => void;
	remove: (step: TourStepDeclaration) => void;
}
