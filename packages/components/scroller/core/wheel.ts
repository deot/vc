import { Wheel } from '@deot/helper-wheel';

// 滚轮写入的目标：Scroller 的实例（位置与尺寸为当前值），见 use-scroller 的 exposed
export interface WheelTarget {
	scrollLeft: number;
	scrollTop: number;
	clientWidth: number;
	clientHeight: number;
	scrollWidth: number;
	scrollHeight: number;
	scrollTo: (options: { x?: number; y?: number }) => void;
}

interface WheelOptions {
	// 只在该方向滚动，纵横增量都用于该方向；不设置时取增量较大的方向
	axis?: () => 'x' | 'y' | undefined;
	// 是否模拟触摸滚动：容器不能原生滚动（overflow: hidden）时需要
	touch?: boolean;
	stopPropagation?: () => boolean;
}

const KEYS = {
	x: ['scrollLeft', 'clientWidth', 'scrollWidth'],
	y: ['scrollTop', 'clientHeight', 'scrollHeight']
} as const;

/**
 * 把元素上的滚轮交给 Scroller：判断该方向能否继续滚动（不能时交还给外层），再按增量写入
 * Scroller 自身的滚轮（wheel、axis）与 Table 表头 / 底部 dock 的转交共用
 * @param el 监听滚轮的元素
 * @param getTarget 写入的 Scroller
 * @param options ~
 * @returns 解除监听
 */
export const bindWheel = (el: HTMLElement, getTarget: () => WheelTarget | null | undefined, options: WheelOptions = {}) => {
	const { axis, touch = true, stopPropagation } = options;

	/**
	 * 某方向能否滚动：有溢出、增量取整后非0，且未到该方向的边界
	 * @param key 方向
	 * @param delta 增量
	 * @returns 能否滚动
	 */
	const canScroll = (key: 'x' | 'y', delta: number) => {
		const target = getTarget();
		if (!target) return false;
		const [position, client, scroll] = KEYS[key];
		const max = target[scroll] - target[client];
		delta = Math.round(delta);
		if (max <= 0 || !delta) return false;
		return delta < 0 ? target[position] > 0 : target[position] < max;
	};

	const handleWheel = (deltaX: number, deltaY: number) => {
		const target = getTarget();
		if (!target) return;
		const locked = axis?.();
		let key: 'x' | 'y';
		let delta: number;
		if (locked) {
			key = locked;
			delta = deltaX + deltaY;
		} else if (Math.abs(deltaY) > Math.abs(deltaX) && target.scrollHeight > target.clientHeight) {
			key = 'y';
			delta = deltaY;
		} else if (deltaX && target.scrollWidth > target.clientWidth) {
			key = 'x';
			delta = deltaX;
		} else {
			return;
		}
		const [position, client, scroll] = KEYS[key];
		target.scrollTo({ [key]: Math.min(Math.max(0, target[position] + delta), target[scroll] - target[client]) });
	};

	const wheel = new Wheel(el, {
		shouldWheelX: delta => canScroll(axis?.() || 'x', delta),
		shouldWheelY: delta => canScroll(axis?.() || 'y', delta),
		touch,
		...(stopPropagation && { stopPropagation })
	});
	wheel.on(handleWheel);
	return () => wheel.off(handleWheel);
};
