import { computed } from 'vue';
import type { Ref } from 'vue';
import { useScrollContain } from '@deot/vc-hooks';
import type { ScrollContainAxis } from '@deot/vc-hooks';
import type { Props, PopupDirection, PopupDragDirection, PopupDragStartEvent, PopupDragEvent, PopupDragEndEvent } from './popup-props';
import type { PopupSnaps } from './use-popup-snaps';
import { SWIPE_DURATION, ease, getTranslate } from './constants';

const SWIPE_TRANSITION = ease(['transform'], SWIPE_DURATION);
const MASK_TRANSITION = ease(['opacity'], SWIPE_DURATION);
// 松手时至少拖动的距离（px），避免轻点或抖动时按速度判为关闭
const MIN_DISTANCE = 10;

// 接管的手势：swipe 跟手关闭；pan 在档位间拖动（snaps）
type Mode = 'swipe' | 'pan';

interface PopupDragNotify {
	(name: 'dragstart', build: () => PopupDragStartEvent): void;
	(name: 'drag', build: () => PopupDragEvent): void;
	(name: 'dragend', build: () => PopupDragEndEvent): void;
}

const getDirection = (axis: ScrollContainAxis, delta: number): PopupDirection => {
	if (axis === 'y') return delta > 0 ? 'bottom' : 'top';
	return delta > 0 ? 'right' : 'left';
};

/**
 * MPopup 内的触摸与鼠标拖动：在 useScrollContain（滚动不外溢、与内部滚动区域的仲裁）之上接管手势滑动关闭（swipeClosable）与多档高度（snaps）
 *
 * - 内容区还能朝手指方向滚动时交给滚动；否则沿允许的方向跟手关闭，或阻止滚动穿透
 * - 多档高度：不在最高档时纵向拖动只移动面板；在最高档时内容能滚就滚，滚到顶后下拉移动面板
 * - stopPropagation 的内层组件（如 PickerCol）的手势不会到这里
 * - 桌面端的鼠标拖动同样可以滑动关闭、拖动档位（不涉及滚动）
 * @param props ~
 * @param options ~
 * @param options.root 组件根节点（遮罩与面板都在其中）
 * @param options.wrapper 面板
 * @param options.handle 指示器
 * @param options.mask 遮罩
 * @param options.isActive 是否显示
 * @param options.close 跟手滑出结束后关闭
 * @param options.snaps 多档高度
 * @param options.dragging 面板是否在跟手（插槽参数）
 * @param options.notify 拖动事件：payload 由 build 生成，没有监听时不生成
 * @returns 绑到根节点上的触摸与鼠标监听，以及清理跟手样式的 reset
 */
export const usePopupTouch = (
	props: Props,
	options: {
		root: Ref<HTMLElement | undefined>;
		wrapper: Ref<HTMLElement | undefined>;
		handle: Ref<HTMLElement | undefined>;
		mask: Ref<HTMLElement | undefined>;
		isActive: Ref<boolean>;
		close: () => void;
		snaps: PopupSnaps;
		dragging: Ref<boolean>;
		notify: PopupDragNotify;
	}
) => {
	const { root, wrapper, handle, mask, isActive, close, snaps, dragging, notify } = options;

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

	let mode: Mode = 'swipe';
	let axis: ScrollContainAxis = 'y';
	let direction: PopupDirection = 'bottom';
	let startTime = 0;
	// 回弹结束后清理样式，或滑出结束后关闭
	let timer: ReturnType<typeof setTimeout> | undefined;
	// 滑出关闭中：不再接受手势
	let closing = false;
	// 跟手：起点（pan 为起点所在档的偏移，swipe 为 0）、当前位置（向外为正）、面板尺寸（swipe）
	let base = 0;
	let position = 0;
	let size = 0;
	// 速度：最近一次采样（向外为正）
	let sample = { position: 0, time: 0 };
	let velocity = 0;
	// 事件：手指方向（最近一次非零的移动）
	let finger: PopupDragDirection = 'down';

	// 指示器：拖动时按手指的纵向方向倾斜（is-up / is-down），松手后复原
	const tilt = (step: number) => {
		const el = handle.value;
		if (!el) return;
		el.classList.toggle('is-up', step < 0);
		el.classList.toggle('is-down', step > 0);
	};

	// 低于最低档时能否关闭：可滑动关闭（swipeClosable）且允许弹出方向
	const canSwipeClose = () => {
		const config = swipe.value;
		return !!config && config.directions.includes(props.placement as PopupDirection);
	};

	// transition 为 undefined 时不改过渡
	const setStyles = (transform: string, opacity: string, transition?: string) => {
		if (wrapper.value) {
			transition !== undefined && (wrapper.value.style.transition = transition);
			wrapper.value.style.transform = transform;
		}
		if (mask.value) {
			transition !== undefined && (mask.value.style.transition = transition && transition !== 'none' ? MASK_TRANSITION : transition);
			mask.value.style.opacity = opacity;
		}
	};

	const translate = (value: number) => {
		const sign = direction === 'bottom' || direction === 'right' ? 1 : -1;
		return `translate${axis === 'y' ? 'Y' : 'X'}(${value * sign}px)`;
	};

	/**
	 * 清除跟手留下的行内样式（关闭后、重新打开前）
	 */
	const reset = () => {
		clearTimeout(timer);
		timer = undefined;
		closing = false;
		dragging.value = false;
		setStyles('', '', '');
	};

	// 采样速度：间隔超过一帧才更新
	const track = () => {
		const now = Date.now();
		if (now - sample.time > 16) {
			velocity = (position - sample.position) / (now - sample.time) * 1000;
			sample = { position, time: now };
		}
	};
	// 最后一次采样之后停住太久，按静止处理
	const releaseVelocity = () => (Date.now() - sample.time > 100 ? 0 : velocity);

	// from：开始跟手的位置；过渡（档位吸附、回弹）中被抓住时为面板此刻的位置，从这里继续跟手，不跳回过渡前的位置
	const startDrag = (from: number) => {
		clearTimeout(timer);
		timer = undefined;
		base = position = from;
		sample = { position, time: Date.now() };
		velocity = 0;
		dragging.value = true;
		if (mode === 'pan') {
			snaps.grab(position);
		} else {
			const el = wrapper.value!;
			size = axis === 'y' ? el.offsetHeight : el.offsetWidth;
			setStyles(position ? translate(position) : '', size ? `${1 - Math.min(1, position / size)}` : '', 'none');
		}
		notify('dragstart', () => ({ snap: snaps.index.value, height: mode === 'pan' ? snaps.heightAt(position) : size }));
	};

	// 从当前位置继续滑出，结束后关闭（离场动画跳过）
	const slideOut = (transform: string) => {
		closing = true;
		setStyles(transform, '0', SWIPE_TRANSITION);
		timer = setTimeout(close, SWIPE_DURATION);
	};

	const { listeners } = useScrollContain({
		root,
		panel: wrapper,
		enabled: () => isActive.value,
		scrollRegExp: () => props.scrollRegExp as Record<string, RegExp>,
		start: () => {
			if (closing) return false;
			startTime = Date.now();
		},
		claim: (context) => {
			const { delta, inside, canScroll } = context;
			axis = context.axis;
			direction = getDirection(axis, delta);
			if (!inside) return false;
			if (snaps.enabled.value && snaps.heights.value.length && axis === 'y') {
				// 向外（bottom 向下、top 向上）为正：不在最高档时上拉移动面板；否则内容能滚就滚，滚不动时下拉移动面板
				const outward = props.placement === 'top' ? -delta : delta;
				const current = snaps.current();
				if (!(outward < 0 && current > 0) && (canScroll(delta) || outward < 0)) return false;
				mode = 'pan';
				startDrag(current);
				return true;
			}
			const config = swipe.value;
			if (canScroll(delta) || !config || !config.directions.includes(direction)) return false;
			mode = 'swipe';
			// 回弹中被抓住：从面板此刻的位置（向外为正）继续
			const sign = direction === 'bottom' || direction === 'right' ? 1 : -1;
			startDrag(timer ? Math.max(0, sign * getTranslate(wrapper.value!, axis)) : 0);
			return true;
		},
		move: (_, __, { dx, dy, stepX, stepY }) => {
			const step = axis === 'y' ? stepY : stepX;
			step && (finger = axis === 'y' ? (step < 0 ? 'up' : 'down') : (step < 0 ? 'left' : 'right'));
			axis === 'y' && stepY && tilt(stepY);

			if (mode === 'pan') {
				const lowest = snaps.offsetOf(0);
				position = Math.max(0, base + (props.placement === 'top' ? -dy : dy));
				// 低于最低档：能关闭时跟手，否则有阻力
				if (position > lowest && !canSwipeClose()) position = lowest + (position - lowest) / 3;
				track();
				snaps.follow(position);
			} else {
				const distance = axis === 'y' ? dy : dx;
				position = Math.max(0, base + (direction === 'bottom' || direction === 'right' ? distance : -distance));
				track();
				setStyles(translate(position), size ? `${1 - Math.min(1, position / size)}` : '');
			}

			notify('drag', () => ({
				snap: snaps.index.value,
				height: mode === 'pan' ? snaps.heightAt(position) : Math.max(0, size - position),
				offset: position - base,
				progress: mode === 'pan' ? snaps.progressAt(position) : (size ? -Math.min(1, position / size) : 0),
				direction: finger,
				velocity
			}));
		},
		end: () => {
			tilt(0);
			const current = mode;
			dragging.value = false;
			const speed = releaseVelocity();
			let target = snaps.index.value;
			let isClose: boolean;

			if (current === 'pan') {
				const result = snaps.release(position, speed, canSwipeClose() ? swipe.value : null);
				isClose = result === 'close';
				// 从当前位置继续滑出（可见高度）后关闭
				isClose
					? slideOut(`translateY(${(props.placement === 'top' ? -1 : 1) * (snaps.heights.value[target] + base)}px)`)
					: (target = result as number);
			} else {
				const config = swipe.value!;
				const percent = size ? position / size : 0;
				// 关闭判定用整段手势的平均速度：很短的快划可能来不及采样
				const average = position / Math.max(1, Date.now() - startTime) * 1000;
				isClose = position > MIN_DISTANCE && (percent >= config.threshold || average > config.speed);
				if (isClose) {
					slideOut(translate(size));
				} else {
					setStyles(position ? translate(0) : '', '', position ? SWIPE_TRANSITION : '');
					timer = setTimeout(() => {
						timer = undefined;
						setStyles('', '', '');
					}, SWIPE_DURATION);
				}
			}

			const progress = isClose ? -1 : (current === 'pan' ? snaps.progressAt(snaps.offsetOf(target)) : 0);
			notify('dragend', () => ({ snap: target, close: isClose, progress, velocity: speed }));
		}
	});

	return {
		reset,
		listeners
	};
};
