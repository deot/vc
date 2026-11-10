import { onBeforeUnmount } from 'vue';
import type { Ref } from 'vue';
import { Utils } from '@deot/vc-shared';
import { useDrag } from './use-drag';
import type { DragPoint } from './use-drag';

export type ScrollContainAxis = 'x' | 'y';

export interface ScrollContainContext {
	// 第一次移动的轴向与该轴上的位移（向下 / 向右为正）
	axis: ScrollContainAxis;
	delta: number;
	// 起点是否在面板内
	inside: boolean;
	/**
	 * 起点到面板之间，是否有滚动容器还能朝手指方向滚动（手指向下时需要 scrollTop > 0）
	 * @param delta 手指在该轴上的位移
	 * @returns ~
	 */
	canScroll: (delta: number) => boolean;
}

export interface ScrollContainMove {
	// 相对按下时的位移
	dx: number;
	dy: number;
	// 相对上一次移动的位移
	stepX: number;
	stepY: number;
}

type GestureEvent = MouseEvent | TouchEvent;
type GestureHandler = (e: GestureEvent, point: DragPoint) => void;

export interface ScrollContainOptions {
	// 监听触摸与鼠标的根节点（遮罩与面板都在其中）
	root: Ref<HTMLElement | undefined>;
	// 面板：路径收集到此为止；面板外（如遮罩）的手势一律阻止
	panel?: Ref<HTMLElement | undefined>;
	// 是否生效（如打开时）；默认生效
	enabled?: () => boolean;
	// 额外视为滚动容器的元素；计算样式 overflow 为 auto / scroll 的元素已自动识别
	scrollRegExp?: () => Record<string, RegExp> | undefined;
	// 按下：返回 false 时不处理本次手势
	start?: (e: GestureEvent, point: DragPoint) => boolean | void;
	// 第一次移动时判定：返回 true 由调用方接管（之后的 move / end 交给调用方，默认滚动被阻止）
	claim?: (context: ScrollContainContext) => boolean;
	move?: (e: GestureEvent, point: DragPoint, move: ScrollContainMove) => void;
	// 接管的手势结束（含 touchcancel、鼠标松开丢失）
	end?: GestureHandler;
}

// pending：还没判定；scroll：交给内部滚动；claim：调用方接管；block：阻止滚动穿透；skip：内层组件已处理
type Mode = 'pending' | 'scroll' | 'claim' | 'block' | 'skip';

// 鼠标从这些元素上按下时不发起拖动（文本输入、选择，以及标记类 vc-drag-ignore）
const MOUSE_IGNORE = 'input, textarea, select, [contenteditable], .vc-drag-ignore';

// 鼠标移动超过这个距离（px）才判定手势
const MOUSE_THRESHOLD = 4;

const preventDefault = (e: Event) => e.preventDefault();

// 鼠标拖动结束后紧接着的 click（松开处）不触发
const swallowClick = () => {
	const swallow = (e: Event) => {
		e.stopPropagation();
		e.preventDefault();
	};
	document.addEventListener('click', swallow, { capture: true, once: true });
	setTimeout(() => document.removeEventListener('click', swallow, { capture: true }));
};

// 计算样式 overflow 为 auto / scroll；该轴为 visible 时取简写
const isScroller = (el: HTMLElement, axis: ScrollContainAxis) => {
	const style = window.getComputedStyle(el);
	const value = axis === 'y' ? style.overflowY : style.overflowX;
	return /(auto|scroll)/.test(!value || value === 'visible' ? style.overflow : value);
};

/**
 * 触摸滚动不外溢（浮层内）：面板内的滚动区域照常滚动，滚到边界或不可滚动时阻止，页面不随之滚动
 *
 * - 第一次移动确定轴向：从触点向上到面板为止，该轴上的滚动容器（自动识别，或命中 scrollRegExp）还能朝手指方向滚动时，整个手势交给滚动；
 *   滚到边界后继续拖动只阻止（不带动页面）；没有可滚动的容器时阻止
 * - 调用方可在判定时接管手势（claim），如滑动关闭、拖动面板
 * - 内层组件已处理的手势（e.defaultPrevented，如 MCarousel）跳过
 * - 鼠标拖动（桌面端）不涉及滚动，只交给 claim：接管后拖动期间不选中文本，松开后的 click 不触发；从输入框、vc-drag-ignore 或已被内层组件处理的按下开始时跳过
 * - 配合 useScrollbar（锁定 body 的 overflow）使用
 * @param options ~
 * @returns 绑到根节点上的触摸与鼠标监听
 */
export const useScrollContain = (options: ScrollContainOptions) => {
	const { root, panel } = options;

	let mode: Mode = 'pending';
	let path: HTMLElement[] = [];
	// 判定轴向后，路径上该轴的滚动容器（overflow 在手势中不变，只算一次）
	let containers: HTMLElement[] = [];
	let inside = false;
	let isMouse = false;
	let axis: ScrollContainAxis = 'y';
	let startX = 0;
	let startY = 0;
	let lastX = 0;
	let lastY = 0;

	// 手指朝 delta 方向移动时，内容还能否滚动：手指向下（delta > 0）需要 scrollTop > 0
	const canScroll = (delta: number) => containers.some((el) => {
		const current = axis === 'y' ? el.scrollTop : el.scrollLeft;
		const max = axis === 'y' ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
		return delta > 0 ? current > 0 : current < max - 1;
	});

	const isContainer = (el: HTMLElement) => {
		const rules = options.scrollRegExp?.();
		return (!!rules && Utils.matchesElementRules(el, rules as any)) || isScroller(el, axis);
	};

	const { listeners } = useDrag({
		start: (e, point) => {
			if (options.enabled && !options.enabled()) return false;
			const target = e.target as HTMLElement;
			isMouse = e.type === 'mousedown';
			// 鼠标只用于接管：没有 claim 时不处理
			if (isMouse && (!options.claim || e.defaultPrevented || target.closest?.(MOUSE_IGNORE))) return false;
			if (options.start?.(e, point) === false) return false;
			const stop = panel?.value;
			inside = !!stop && stop.contains(target);
			path = [];
			for (let el: HTMLElement | null = target; el && el !== root.value; el = el.parentElement) {
				path.push(el);
				if (el === stop) break;
			}
			mode = 'pending';
			startX = lastX = point.clientX;
			startY = lastY = point.clientY;
		},
		move: (event, point) => {
			const dx = point.clientX - startX;
			const dy = point.clientY - startY;
			const stepX = point.clientX - lastX;
			const stepY = point.clientY - lastY;
			lastX = point.clientX;
			lastY = point.clientY;

			if (mode === 'pending') {
				if (event.defaultPrevented) {
					mode = 'skip';
					return;
				}
				if (!dx && !dy) return;
				// 鼠标在点击时常有几个像素的抖动：移动超过阈值才判定，避免轻点被当成拖动（之后的 click 也会被吞掉）
				if (isMouse && Math.abs(dx) < MOUSE_THRESHOLD && Math.abs(dy) < MOUSE_THRESHOLD) return;
				axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
				const delta = axis === 'y' ? dy : dx;
				containers = path.filter(isContainer);
				const claimed = !!options.claim?.({ axis, delta, inside, canScroll });
				// 鼠标拖动不会滚动页面：没有接管时不处理
				mode = claimed ? 'claim' : isMouse ? 'skip' : canScroll(delta) ? 'scroll' : 'block';
				if (claimed && isMouse) {
					window.getSelection()?.removeAllRanges();
					document.addEventListener('selectstart', preventDefault);
				}
			}

			if (mode === 'skip') return;

			if (mode === 'scroll') {
				// 滚到边界后继续拖动会带动页面（滚动链），此时只阻止
				const step = axis === 'y' ? stepY : stepX;
				step && !canScroll(step) && event.cancelable && event.preventDefault();
				return;
			}

			event.cancelable && event.preventDefault();
			mode === 'claim' && options.move?.(event, point, { dx, dy, stepX, stepY });
		},
		end: (e, point) => {
			const current = mode;
			mode = 'pending';
			if (current !== 'claim') return;
			if (isMouse) {
				document.removeEventListener('selectstart', preventDefault);
				swallowClick();
			}
			options.end?.(e, point);
		}
	});

	onBeforeUnmount(() => document.removeEventListener('selectstart', preventDefault));

	return {
		listeners: {
			onMousedown: listeners.onMousedown,
			onTouchstart: listeners.onTouchstart,
			onTouchmove: listeners.onTouchmove,
			onTouchend: listeners.onTouchend,
			onTouchcancel: listeners.onTouchcancel
		}
	};
};
