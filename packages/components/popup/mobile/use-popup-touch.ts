import { computed } from 'vue';
import type { Ref } from 'vue';
import { useDrag } from '@deot/vc-hooks';
import { Utils } from '@deot/vc-shared';
import type { Props, PopupDirection } from './popup-props';

// 手势跟手后的滑出 / 回弹时长与曲线（与离场动画一致）
export const SWIPE_DURATION = 240;
export const EASING = 'cubic-bezier(0.34, 0.69, 0.1, 1)';
// 松手时至少拖动的距离（px），避免轻点或抖动时按速度判为关闭
const MIN_DISTANCE = 10;

type Axis = 'x' | 'y';
// pending：还没判定；scroll：交给内部滚动；swipe：跟手关闭；block：阻止滚动穿透；skip：内层组件已处理
type Mode = 'pending' | 'scroll' | 'swipe' | 'block' | 'skip';

const getDirection = (axis: Axis, delta: number): PopupDirection => {
	if (axis === 'y') return delta > 0 ? 'bottom' : 'top';
	return delta > 0 ? 'right' : 'left';
};

/**
 * MPopup 内的触摸：防滚动穿透、与内部滚动区域的仲裁、手势滑动关闭（swipeClosable）
 *
 * - 滚动容器自动识别：从触点向上到面板为止，计算样式 overflow 为 auto / scroll 的元素，或命中 scrollRegExp 的元素
 * - 第一次移动确定轴向：该方向上还有容器能滚就交给滚动，整个手势不再切换；滚到边界后只阻止穿透
 * - 否则沿允许的方向跟手关闭（swipeClosable），或阻止滚动穿透
 * - 内层组件已处理的手势（e.defaultPrevented，如 MCarousel）跳过；stopPropagation 的（如 PickerCol）不会到这里
 * @param props ~
 * @param options ~
 * @param options.root 组件根节点（遮罩与面板都在其中）
 * @param options.wrapper 面板
 * @param options.mask 遮罩
 * @param options.isActive 是否显示
 * @param options.close 跟手滑出结束后关闭
 * @returns 绑到根节点上的触摸监听，以及清理跟手样式的 reset
 */
export const usePopupTouch = (
	props: Props,
	options: {
		root: Ref<HTMLElement | undefined>;
		wrapper: Ref<HTMLElement | undefined>;
		mask: Ref<HTMLElement | undefined>;
		isActive: Ref<boolean>;
		close: () => void;
	}
) => {
	const { root, wrapper, mask, isActive, close } = options;

	const swipe = computed(() => {
		const value = props.swipeClosable ?? props.maskClosable;
		if (!value) return null;
		const config = typeof value === 'object' ? value : {};
		return {
			directions: config.directions || (props.placement === 'center' ? [] : [props.placement as PopupDirection]),
			threshold: config.threshold ?? 0.3,
			speed: config.speed ?? 200
		};
	});

	let mode: Mode = 'pending';
	let path: HTMLElement[] = [];
	let inWrapper = false;
	let startX = 0;
	let startY = 0;
	let startTime = 0;
	let lastX = 0;
	let lastY = 0;
	let direction: PopupDirection = 'bottom';
	let offset = 0;
	let timer: ReturnType<typeof setTimeout> | undefined;

	const isContainer = (el: HTMLElement, axis: Axis) => {
		if (Utils.matchesElementRules(el, props.scrollRegExp as any)) return true;
		const style = window.getComputedStyle(el);
		return /(auto|scroll)/.test(axis === 'y' ? style.overflowY : style.overflowX);
	};

	// 手指朝 delta 方向移动时，内容还能否滚动：手指向下（delta > 0）需要 scrollTop > 0
	const canScroll = (el: HTMLElement, axis: Axis, delta: number) => {
		const position = axis === 'y' ? el.scrollTop : el.scrollLeft;
		const max = axis === 'y' ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
		return delta > 0 ? position > 0 : position < max - 1;
	};

	const hasScrollable = (axis: Axis, delta: number) => {
		return path.some(el => isContainer(el, axis) && canScroll(el, axis, delta));
	};

	const setStyles = (transform: string, opacity: string, transition: string) => {
		if (wrapper.value) {
			wrapper.value.style.transition = transition;
			wrapper.value.style.transform = transform;
		}
		if (mask.value) {
			mask.value.style.transition = transition && transition.replace('transform', 'opacity');
			mask.value.style.opacity = opacity;
		}
	};

	const getSize = () => {
		const el = wrapper.value;
		if (!el) return 0;
		return direction === 'top' || direction === 'bottom' ? el.offsetHeight : el.offsetWidth;
	};

	const translate = (value: number) => {
		const sign = direction === 'bottom' || direction === 'right' ? 1 : -1;
		return `translate${direction === 'top' || direction === 'bottom' ? 'Y' : 'X'}(${value * sign}px)`;
	};

	/**
	 * 清除跟手留下的行内样式（关闭后、重新打开前）
	 */
	const reset = () => {
		clearTimeout(timer);
		mode = 'pending';
		offset = 0;
		setStyles('', '', '');
	};

	const { listeners } = useDrag({
		start: (e, point) => {
			if (!isActive.value) return false;
			clearTimeout(timer);
			const target = e.target as HTMLElement;
			const stop = wrapper.value;
			inWrapper = !!stop && stop.contains(target);
			path = [];
			for (let el: HTMLElement | null = target; el && el !== root.value; el = el.parentElement) {
				path.push(el);
				if (el === stop) break;
			}
			mode = 'pending';
			offset = 0;
			startX = lastX = point.clientX;
			startY = lastY = point.clientY;
			startTime = Date.now();
		},
		move: (e, point) => {
			const dx = point.clientX - startX;
			const dy = point.clientY - startY;
			const stepX = point.clientX - lastX;
			const stepY = point.clientY - lastY;
			lastX = point.clientX;
			lastY = point.clientY;

			if (mode === 'pending') {
				if (e.defaultPrevented) {
					mode = 'skip';
					return;
				}
				if (!dx && !dy) return;
				const axis: Axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
				const delta = axis === 'y' ? dy : dx;
				direction = getDirection(axis, delta);
				if (hasScrollable(axis, delta)) {
					mode = 'scroll';
				} else {
					const config = swipe.value;
					mode = config && inWrapper && config.directions.includes(direction) ? 'swipe' : 'block';
				}
			}

			if (mode === 'skip') return;

			if (mode === 'scroll') {
				// 滚到边界后继续拖动会带动页面（滚动链），此时只阻止
				const axis: Axis = direction === 'top' || direction === 'bottom' ? 'y' : 'x';
				const step = axis === 'y' ? stepY : stepX;
				step && !hasScrollable(axis, step) && e.cancelable && e.preventDefault();
				return;
			}

			e.cancelable && e.preventDefault();
			if (mode !== 'swipe') return;

			const distance = direction === 'top' || direction === 'bottom' ? dy : dx;
			offset = Math.max(0, direction === 'bottom' || direction === 'right' ? distance : -distance);
			const size = getSize();
			setStyles(translate(offset), size ? `${1 - Math.min(1, offset / size)}` : '', 'none');
		},
		end: () => {
			if (mode !== 'swipe') {
				mode = 'pending';
				return;
			}
			mode = 'pending';
			const config = swipe.value!;
			const size = getSize();
			const percent = size ? offset / size : 0;
			const speed = offset / Math.max(1, Date.now() - startTime) * 1000;
			const transition = `transform ${SWIPE_DURATION}ms ${EASING}`;

			if (offset > MIN_DISTANCE && (percent >= config.threshold || speed > config.speed)) {
				// 从当前位置继续滑出，结束后关闭（离场动画跳过）
				setStyles(translate(size), '0', transition);
				timer = setTimeout(close, SWIPE_DURATION);
			} else {
				setStyles(offset ? translate(0) : '', '', offset ? transition : '');
				timer = setTimeout(() => setStyles('', '', ''), SWIPE_DURATION);
			}
		}
	});

	return {
		reset,
		listeners: {
			onTouchstart: listeners.onTouchstart,
			onTouchmove: listeners.onTouchmove,
			onTouchend: listeners.onTouchend,
			onTouchcancel: listeners.onTouchcancel
		}
	};
};
