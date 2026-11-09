import { computed } from 'vue';
import type { Ref } from 'vue';
import { useDrag } from '@deot/vc-hooks';
import { Utils } from '@deot/vc-shared';
import type { Props, PopupDirection, PopupDragDirection, PopupDragStartEvent, PopupDragEvent, PopupDragEndEvent } from './popup-props';
import type { PopupSnaps } from './use-popup-snaps';

// 手势跟手后的滑出 / 回弹时长与曲线（与离场动画一致）
export const SWIPE_DURATION = 240;
export const EASING = 'cubic-bezier(0.34, 0.69, 0.1, 1)';
// 松手时至少拖动的距离（px），避免轻点或抖动时按速度判为关闭
const MIN_DISTANCE = 10;

type Axis = 'x' | 'y';
// pending：还没判定；scroll：交给内部滚动；swipe：跟手关闭；pan：在档位间拖动（snaps）；block：阻止滚动穿透；skip：内层组件已处理
type Mode = 'pending' | 'scroll' | 'swipe' | 'pan' | 'block' | 'skip';

export interface PopupDragNotify {
	(name: 'dragstart', build: () => PopupDragStartEvent): void;
	(name: 'drag', build: () => PopupDragEvent): void;
	(name: 'dragend', build: () => PopupDragEndEvent): void;
}

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
 * - 多档高度（snaps）：不在最高档时纵向拖动只移动面板；在最高档时内容能滚就滚，滚到顶后下拉移动面板
 * @param props ~
 * @param options ~
 * @param options.root 组件根节点（遮罩与面板都在其中）
 * @param options.wrapper 面板
 * @param options.mask 遮罩
 * @param options.isActive 是否显示
 * @param options.close 跟手滑出结束后关闭
 * @param options.snaps 多档高度
 * @param options.dragging 面板是否在跟手（插槽参数）
 * @param options.notify 拖动事件：payload 由 build 生成，没有监听时不生成
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
		snaps?: PopupSnaps;
		dragging?: Ref<boolean>;
		notify?: PopupDragNotify;
	}
) => {
	const { root, wrapper, mask, isActive, close, snaps, dragging } = options;
	const notify: PopupDragNotify = options.notify || (() => {});

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
	// pan：起点所在档的偏移、当前位置、最近一次采样（算松手速度）
	let panBase = 0;
	let panPosition = 0;
	let sample = { position: 0, time: 0 };
	let velocity = 0;
	// 事件：手指方向（最近一次非零的移动）
	let finger: PopupDragDirection = 'down';
	// 指示器：拖动时按手指的纵向方向倾斜（is-up / is-down），松手后复原
	let handle: HTMLElement | null = null;
	const tilt = (step: number) => {
		if (!handle) return;
		handle.classList.toggle('is-up', step < 0);
		handle.classList.toggle('is-down', step > 0);
	};

	// 低于最低档时能否关闭：可滑动关闭（swipeClosable）且允许弹出方向
	const canSwipeClose = () => {
		const config = swipe.value;
		return !!config && config.directions.includes(props.placement as PopupDirection);
	};

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
		dragging && (dragging.value = false);
		mode = 'pending';
		offset = 0;
		setStyles('', '', '');
	};

	// 采样速度（向外为正）：间隔超过一帧才更新
	const track = (position: number) => {
		const now = Date.now();
		if (now - sample.time > 16) {
			velocity = (position - sample.position) / (now - sample.time) * 1000;
			sample = { position, time: now };
		}
	};
	// 最后一次采样之后停住太久，按静止处理
	const releaseVelocity = () => (Date.now() - sample.time > 100 ? 0 : velocity);
	const currentSnap = () => (snaps ? snaps.index.value : 0);

	const startDrag = (position: number) => {
		sample = { position, time: Date.now() };
		velocity = 0;
		dragging && (dragging.value = true);
		notify('dragstart', () => ({
			snap: currentSnap(),
			height: mode === 'pan' ? snaps!.heightAt(position) : getSize()
		}));
	};

	const endDrag = (snap: number, isClose: boolean, progress: number, speed: number) => {
		dragging && (dragging.value = false);
		notify('dragend', () => ({ snap, close: isClose, progress, velocity: speed }));
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
			handle = stop?.querySelector<HTMLElement>(':scope > .vcm-popup__handle') || null;
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
				if (snaps && snaps.enabled.value && snaps.heights.value.length && inWrapper && axis === 'y') {
					// 向外（bottom 向下、top 向上）为正
					const outward = props.placement === 'top' ? -delta : delta;
					const isTop = snaps.offsetOf(snaps.index.value) === 0;
					if (outward < 0 && !isTop) {
						mode = 'pan';
					} else if (hasScrollable(axis, delta)) {
						mode = 'scroll';
					} else {
						mode = outward > 0 ? 'pan' : 'block';
					}
					if (mode === 'pan') {
						panBase = panPosition = snaps.offsetOf(snaps.index.value);
						startDrag(panPosition);
					}
				} else if (hasScrollable(axis, delta)) {
					mode = 'scroll';
				} else {
					const config = swipe.value;
					mode = config && inWrapper && config.directions.includes(direction) ? 'swipe' : 'block';
					mode === 'swipe' && startDrag(0);
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

			const isVertical = mode === 'pan' || direction === 'top' || direction === 'bottom';
			const step = isVertical ? stepY : stepX;
			step && (finger = isVertical ? (step < 0 ? 'up' : 'down') : (step < 0 ? 'left' : 'right'));

			if (mode === 'pan') {
				const outward = props.placement === 'top' ? -dy : dy;
				const lowest = snaps!.offsetOf(0);
				let position = Math.max(0, panBase + outward);
				// 低于最低档：能关闭时跟手，否则有阻力
				if (position > lowest && !canSwipeClose()) position = lowest + (position - lowest) / 3;
				panPosition = position;
				stepY && tilt(stepY);
				track(position);
				snaps!.follow(position);
				notify('drag', () => ({
					snap: currentSnap(),
					height: snaps!.heightAt(position),
					offset: position - panBase,
					progress: snaps!.progressAt(position),
					direction: finger,
					velocity
				}));
				return;
			}

			if (mode !== 'swipe') return;

			(direction === 'top' || direction === 'bottom') && stepY && tilt(stepY);
			const distance = direction === 'top' || direction === 'bottom' ? dy : dx;
			offset = Math.max(0, direction === 'bottom' || direction === 'right' ? distance : -distance);
			const size = getSize();
			track(offset);
			setStyles(translate(offset), size ? `${1 - Math.min(1, offset / size)}` : '', 'none');
			notify('drag', () => ({
				snap: currentSnap(),
				height: Math.max(0, size - offset),
				offset,
				progress: size ? -Math.min(1, offset / size) : 0,
				direction: finger,
				velocity
			}));
		},
		end: () => {
			tilt(0);
			if (mode === 'pan') {
				mode = 'pending';
				const speed = releaseVelocity();
				const config = canSwipeClose() ? swipe.value : null;
				const result = snaps!.release(panPosition, speed, config);
				result === 'close'
					? endDrag(snaps!.index.value, true, -1, speed)
					: endDrag(result, false, snaps!.progressAt(snaps!.offsetOf(result)), speed);
				if (result === 'close') {
					// 从当前位置继续滑出（可见高度）后关闭
					const visible = snaps!.heights.value[snaps!.index.value] || 0;
					const el = wrapper.value;
					if (el) {
						el.style.transition = `transform ${SWIPE_DURATION}ms ${EASING}`;
						el.style.transform = `translateY(${(props.placement === 'top' ? -1 : 1) * (visible + panBase)}px)`;
					}
					if (mask.value) {
						mask.value.style.transition = `opacity ${SWIPE_DURATION}ms ${EASING}`;
						mask.value.style.opacity = '0';
					}
					timer = setTimeout(close, SWIPE_DURATION);
				}
				return;
			}
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

			const isClose = offset > MIN_DISTANCE && (percent >= config.threshold || speed > config.speed);
			endDrag(currentSnap(), isClose, isClose ? -1 : 0, releaseVelocity());
			if (isClose) {
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
