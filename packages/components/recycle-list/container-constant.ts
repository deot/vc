export const DEFAULT = 1;
export const PULL = 2;
export const PENDING = 3;
export const REFRESH = 4;

export const STATUS_MAP = {
	DOWN: {
		[DEFAULT]: '~',
		[PULL]: '↓ 下拉刷新',
		[PENDING]: '↑ 释放更新',
		[REFRESH]: '加载中...',
	},
	UP: {
		[DEFAULT]: '~',
		[PULL]: '↑ 上拉刷新',
		[PENDING]: '↓ 释放更新',
		[REFRESH]: '加载中...',
	}
};
