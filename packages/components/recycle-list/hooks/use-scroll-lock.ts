import { onBeforeUnmount } from 'vue';

/**
 * 程序化滚动后继续屏蔽滚动处理的时长（约一帧），
 * 覆盖浏览器异步派发的原生 scroll 事件，避免误触发 loadData / 广播
 */
const SCROLL_LOCK_MS = 16.7;

/**
 * 程序化滚动锁：lock 后调用方应忽略滚动事件，unlock 要等一帧后才真正释放
 * 原 isManualScroll = 1 / setTimeout(() => (isManualScroll = 0), 16.7)
 * @returns 锁状态查询与开关
 */
export const useScrollLock = () => {
	let locked = false;
	let timer: ReturnType<typeof setTimeout> | undefined;

	onBeforeUnmount(() => clearTimeout(timer));

	return {
		isLocked: () => locked,
		lock: () => {
			clearTimeout(timer);
			locked = true;
		},
		unlock: () => {
			clearTimeout(timer);
			timer = setTimeout(() => (locked = false), SCROLL_LOCK_MS);
		}
	};
};
