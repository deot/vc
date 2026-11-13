import { DRAG_IGNORE, canScrollToward, isScroller, useDrag } from '@deot/vc-hooks';
import type { DragPoint } from '@deot/vc-hooks';

export interface TabsSwipeOptions {
	// 是否开启（读取时机为按下时）
	enabled: () => boolean;
	// 当前标签的下标与标签总数
	getIndex: () => number;
	getCount: () => number;
	// 该下标的标签是否禁用
	isDisabled: (index: number) => boolean;
	// 切换到该下标
	change: (index: number) => void;
}

// 移动超过该距离（px）才判定方向
const AXIS_THRESHOLD = 10;
// 横向超过该距离（px），或超过最小距离且快速甩动（px/ms）时切换
const DISTANCE_THRESHOLD = 50;
const FLICK_DISTANCE = 20;
const VELOCITY_THRESHOLD = 0.3;

// 起点到内容区之间，有元素还能朝手指方向横向滚动：交给它
const canScrollX = (target: Element | null, root: Element, delta: number) => {
	for (let el = target as HTMLElement | null; el && el !== root; el = el.parentElement) {
		if (el.scrollWidth > el.clientWidth && isScroller(el, 'x') && canScrollToward(el, 'x', delta)) return true;
	}
	return false;
};

/**
 * MTabs 的 swipeable：在内容区左右滑动切换到相邻的标签（跳过禁用的）
 * 	- 只识别触摸；第一次越过阈值时锁定方向，纵向交给页面（或弹层）滚动
 * 	- 松手时横向距离或速度过阈值才切换，切换动画沿用 animated
 * @param options ~
 * @returns 绑到内容区上的监听
 */
export const useTabsSwipe = (options: TabsSwipeOptions) => {
	let startX = 0;
	let startY = 0;
	let startTime = 0;
	let axis: 'x' | 'y' | null = null;
	let root: Element | null = null;
	let target: Element | null = null;

	const reset = () => {
		axis = null;
		root = null;
		target = null;
	};

	const { listeners } = useDrag({
		start: (e, point) => {
			// 鼠标拖动用于选中文字，不切换
			if (!options.enabled() || !('touches' in e)) return false;
			target = e.target as Element;
			if (target?.closest?.(DRAG_IGNORE)) return false;
			root = e.currentTarget as Element;
			startX = point.clientX;
			startY = point.clientY;
			startTime = Date.now();
			axis = null;
		},
		move: (e, point: DragPoint) => {
			const dx = point.clientX - startX;
			const dy = point.clientY - startY;
			if (!axis) {
				if (Math.max(Math.abs(dx), Math.abs(dy)) < AXIS_THRESHOLD) return;
				axis = Math.abs(dx) > Math.abs(dy) && !canScrollX(target, root!, dx) ? 'x' : 'y';
			}
			// 横向滑动时不让页面跟着横向滚动
			axis === 'x' && e.cancelable && e.preventDefault();
		},
		end: (_, point: DragPoint) => {
			const dx = point.clientX - startX;
			const distance = Math.abs(dx);
			const velocity = distance / Math.max(1, Date.now() - startTime);
			const isSwipe = axis === 'x'
				&& (distance >= DISTANCE_THRESHOLD || (distance >= FLICK_DISTANCE && velocity >= VELOCITY_THRESHOLD));
			reset();
			if (!isSwipe) return;

			// 手指向左（dx < 0）切到下一个
			const step = dx < 0 ? 1 : -1;
			const count = options.getCount();
			for (let index = options.getIndex() + step; index >= 0 && index < count; index += step) {
				if (options.isDisabled(index)) continue;
				options.change(index);
				return;
			}
		},
		cancel: reset
	});

	return { listeners };
};
