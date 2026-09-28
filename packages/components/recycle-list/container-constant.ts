export const DEFAULT = 1;
export const PULL = 2;
export const PENDING = 3;
export const REFRESH = 4;

export const STATUS_MAP = {
	DOWN: {
		[PULL]: 'pullDown',
		[PENDING]: 'releaseUp',
		[REFRESH]: 'refreshing',
	},
	UP: {
		[PULL]: 'pullUp',
		[PENDING]: 'releaseDown',
		[REFRESH]: 'refreshing',
	},
	RIGHT: {
		[PULL]: 'pullRight',
		[PENDING]: 'releaseLeft',
		[REFRESH]: 'refreshing',
	},
	LEFT: {
		[PULL]: 'pullLeft',
		[PENDING]: 'releaseRight',
		[REFRESH]: 'refreshing',
	},
};
