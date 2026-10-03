import { useDrag } from '@deot/vc-hooks';
import type { DragPoint } from '@deot/vc-hooks';

/**
 * 色板、色相条、透明度条共用的拖动：按下、移动、松开都按触点位置取值
 * @param handleDrag 按触点位置取值
 * @returns 绑到元素上的监听
 */
export const useDraggable = (handleDrag: (point: DragPoint) => void) => {
	const handle = (e: MouseEvent | TouchEvent, point: DragPoint) => {
		// 触摸拖动不滚动页面
		e.type.startsWith('touch') && e.cancelable && e.preventDefault();
		handleDrag(point);
	};

	return useDrag({
		selectable: false,
		start: handle,
		move: handle,
		end: handle,
		// 手势被打断时的触点位置不作数：保持最后一次拖动的值
		cancel: () => {}
	}).listeners;
};
