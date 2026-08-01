import { getScroller } from '@deot/helper-dom';

type InjectedScroller = {
	wrapper?: HTMLElement;
	scrollTo?: (options: { x?: number; y?: number }) => void;
	on?: (listener: (e: any) => void) => void;
	off?: (listener: (e: any) => void) => void;
};

type AxisKeys = {
	axis: 'x' | 'y';
	scrollAxis: 'scrollLeft' | 'scrollTop';
	clientSize: 'clientWidth' | 'clientHeight';
	scrollSize: 'scrollWidth' | 'scrollHeight';
	offsetSize: 'offsetWidth' | 'offsetHeight';
};

type ViewportRegistry = {
	anchorElement?: HTMLElement;
	anchorPriority: string;
	anchorValue: string;
	listeners: Set<() => void>;
};

const registries = new WeakMap<object, ViewportRegistry>();

const getAnchorElement = (target: object) => {
	const win = target as Window;
	if (win.window === win) {
		return (win.document.scrollingElement || win.document.documentElement) as HTMLElement;
	}
	return (target as HTMLElement).style ? target as HTMLElement : undefined;
};

export const registerViewport = (target: object, invalidate: () => void) => {
	let registry = registries.get(target);
	if (!registry) {
		const anchorElement = getAnchorElement(target);
		registry = {
			anchorElement,
			anchorPriority: anchorElement?.style.getPropertyPriority('overflow-anchor') || '',
			anchorValue: anchorElement?.style.getPropertyValue('overflow-anchor') || '',
			listeners: new Set()
		};
		anchorElement?.style.setProperty('overflow-anchor', 'none');
		registries.set(target, registry);
	}
	registry.listeners.add(invalidate);
	return () => {
		registry!.listeners.delete(invalidate);
		if (registry!.listeners.size !== 0) return;

		const { anchorElement, anchorPriority, anchorValue } = registry!;
		if (anchorElement?.style.getPropertyValue('overflow-anchor') === 'none') {
			if (anchorValue) {
				anchorElement.style.setProperty('overflow-anchor', anchorValue, anchorPriority);
			} else {
				anchorElement.style.removeProperty('overflow-anchor');
			}
		}
		registries.delete(target);
	};
};

export const invalidateViewport = (target?: object) => {
	if (!target) return;
	registries.get(target)?.listeners.forEach(invalidate => invalidate());
};

export class ExternalViewport {
	target: Window | HTMLElement;
	scroller?: InjectedScroller;
	keys: AxisKeys;

	constructor(target: Window | HTMLElement, scroller: InjectedScroller | undefined, keys: AxisKeys) {
		this.target = target;
		this.scroller = scroller;
		this.keys = keys;
	}

	get isWindow() {
		return !!(this.target as Window).window;
	}

	get mainOffset() {
		if (!this.isWindow) return (this.target as HTMLElement)[this.keys.scrollAxis] || 0;
		const win = this.target as Window;
		const scrolling = win.document.scrollingElement || win.document.documentElement;
		return (scrolling as any)?.[this.keys.scrollAxis]
			|| (this.keys.axis === 'y' ? win.scrollY : win.scrollX)
			|| 0;
	}

	get clientSize() {
		if (!this.isWindow) return (this.target as HTMLElement)[this.keys.clientSize] || 0;
		const win = this.target as Window;
		return (this.keys.axis === 'y' ? win.innerHeight : win.innerWidth)
			|| win.document.documentElement[this.keys.clientSize]
			|| 0;
	}

	get scrollSize() {
		if (!this.isWindow) return (this.target as HTMLElement)[this.keys.scrollSize] || 0;
		const win = this.target as Window;
		const scrolling = win.document.scrollingElement || win.document.documentElement;
		return (scrolling as HTMLElement)[this.keys.scrollSize] || 0;
	}

	setMainOffset(value: number) {
		const options = { [this.keys.axis]: value };
		if (this.scroller?.scrollTo) {
			this.scroller.scrollTo(options);
			return;
		}
		if (this.isWindow) {
			const win = this.target as Window;
			const scrolling = win.document.scrollingElement || win.document.documentElement;
			(scrolling as any)[this.keys.scrollAxis] = value;
			return;
		}
		(this.target as HTMLElement)[this.keys.scrollAxis] = value;
	}

	on(listener: (e: any) => void) {
		if (this.scroller?.on) {
			this.scroller.on(listener);
			return;
		}
		this.target.addEventListener('scroll', listener as EventListener);
	}

	off(listener: (e: any) => void) {
		if (this.scroller?.off) {
			this.scroller.off(listener);
			return;
		}
		this.target.removeEventListener('scroll', listener as EventListener);
	}

	getElementStart(el: HTMLElement) {
		const rect = el.getBoundingClientRect();
		const start = this.keys.axis === 'y' ? rect.top : rect.left;
		if (this.isWindow) return this.mainOffset + start;
		const target = this.target as HTMLElement;
		const targetRect = target.getBoundingClientRect();
		const targetStart = this.keys.axis === 'y' ? targetRect.top : targetRect.left;
		const border = this.keys.axis === 'y' ? target.clientTop : target.clientLeft;
		return this.mainOffset + start - targetStart - border;
	}

	getElementEnd(el: HTMLElement) {
		const rect = el.getBoundingClientRect();
		const end = this.keys.axis === 'y' ? rect.bottom : rect.right;
		if (this.isWindow) return this.mainOffset + end;
		const target = this.target as HTMLElement;
		const targetRect = target.getBoundingClientRect();
		const targetStart = this.keys.axis === 'y' ? targetRect.top : targetRect.left;
		const border = this.keys.axis === 'y' ? target.clientTop : target.clientLeft;
		return this.mainOffset + end - targetStart - border;
	}
}

export const resolveExternalViewport = (
	root: HTMLElement,
	injected: InjectedScroller | undefined,
	keys: AxisKeys
) => {
	const target = (getScroller(root.parentElement || root.ownerDocument.documentElement, {
		direction: keys.axis,
		className: /(?:vc-scroller-wheel|vc-scroller__wrapper)/
	}) || root.ownerDocument.defaultView) as Window | HTMLElement;
	const scroller = injected?.wrapper === target ? injected : undefined;
	return new ExternalViewport(target, scroller, keys);
};
