export type ScrollerExposed = {
	refresh: () => void;
	setScrollTop: (v: number) => void;
	setScrollLeft: (v: number) => void;
};