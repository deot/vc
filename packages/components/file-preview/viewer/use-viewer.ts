import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { useGesture, useKeyboard, useScrollbar } from '@deot/vc-hooks';
import type { VirtualElement } from '../../vc';
import type { GestureMoveEndEvent, GestureMoveEvent, GestureMoveStartEvent, GesturePinchEvent, GestureTapEvent } from '@deot/vc-hooks';
import { VcInstance } from '../../vc';
import type { FilePreviewImageFit } from '../types';
import type { ImageSlideExposed } from './image-slide';
import type { RevealExposed } from './reveal';
import type { Props } from './viewer-props';
import { reflow, waitTransition } from './utils';
import type { Point, Size } from './utils';

type Mode = 'pan' | 'swipe' | 'close' | 'pinch' | null;

export type Slide = {
	index: number;
	step: number;
	// 两项时另一项挂在两侧，key 让即将滑入的那一份沿用已渲染的实例
	key: number | string;
	isActive: boolean;
	// 打开的那一项、还没切换过：画面就位后从触发元素放大
	isAnimated: boolean;
	triggerElement: Element | VirtualElement | null;
	style: Record<string, string>;
};

// 横向超过该距离（px）或快速甩动时切换
const SWIPE_DISTANCE = 80;
const FLICK_VELOCITY = 0.5;
// PhotoSwipe 纵向拖动只跟手指的 60%，蒙层按这段位移相对视口高度的 1/3 变淡
const VERTICAL_DRAG_FRICTION = 0.6;
// 预测位置越过视口高度 1/3 的该比例就关闭，向上和向下同一条线
const MIN_RATIO_TO_CLOSE = 0.4;
// 松手速度按 0.995 的衰减投成位移：v * 0.995 / (1 - 0.995)
const VERTICAL_PROJECT = 199;
// 不循环时拖过两端的阻尼
const EDGE_RESISTANCE = 0.35;
// 捏合到初始尺寸的该比例以下松手即关闭
const PINCH_CLOSE = 0.8;
const WHEEL_RATE = 0.002;
const IGNORE = 'video, audio, iframe, button, a, input, textarea, .vc-file-viewer__cluster, .vc-file-viewer__counter';
const FOCUSABLE = 'button, a[href], iframe';
const EDITABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const positive = (value: unknown, fallback: number) => {
	const n = Number(value);
	return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const useViewer = (props: Props, onFulfilled: () => void) => {
	const root = shallowRef<HTMLElement>();
	const stage = shallowRef<HTMLElement>();
	// 当前页的开合与图片缩放；自定义页两者都没有，图片以外的页只有开合
	const activeReveal = shallowRef<RevealExposed | null>(null);
	const activeImage = shallowRef<ImageSlideExposed | null>(null);
	const openedIndex = props.current;
	const current = ref(openedIndex);
	const offset = ref<Point>({ x: 0, y: 0 });
	const dim = ref(1);
	const isNavigated = ref(false);
	const isSliding = ref(false);
	const isDragging = ref(false);
	const isOpen = ref(false);
	// 打开的那一项还在等就位：蒙层先淡入，中间显示加载中，开始放大时收起
	const isLoading = ref(false);
	let isWaiting = false;
	let isMounted = false;
	const isIdle = ref(false);
	const isVisible = ref(true);
	const viewport = ref<Size>({ w: window.innerWidth, h: window.innerHeight });
	const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
	let mode: Mode = null;
	let base = 0;
	let pinchRatio = 1;
	let isClosing = false;

	useScrollbar(isVisible);

	const count = computed(() => props.data.length);
	// 两项也循环：左右都是另一项，箭头保持。一项没有另一项
	const isLoop = computed(() => count.value >= 2);
	// 两项时挂在 lead 一侧的那份沿用稳定的 key
	const lead = ref(1);
	const row = computed(() => props.data[current.value]);

	// configure 会整对象替换，缺省或非法的倍数回退到默认值
	const imageOptions = computed(() => {
		const options = VcInstance.options.FilePreview?.imageOptions;
		const max = positive(options?.max, 10);
		return {
			fit: (options?.fit === 'actual' ? 'actual' : 'max-edge') as FilePreviewImageFit,
			max,
			min: Math.min(positive(options?.min, 1), max),
			placeholder: props.placeholder ?? options?.placeholder !== false
		};
	});

	const indexOf = (step: number) => {
		const next = current.value + step;
		if (isLoop.value) return (next % count.value + count.value) % count.value;
		return next >= 0 && next < count.value ? next : -1;
	};
	const hasPrev = computed(() => indexOf(-1) >= 0);
	const hasNext = computed(() => indexOf(1) >= 0);

	// 打开的那一项用打开时取好的起点，其余项用各自的 element
	const triggerElementOf = (index: number) => (
		index === openedIndex ? props.triggerElement : props.data[index]?.element
	) ?? null;
	// 有触发元素时从它放大，蒙层跟着淡入；否则整层淡入。缩不回去时改为整层淡出
	const isZoom = ref(!!triggerElementOf(openedIndex));

	// 只挂当前页与左右相邻页
	const slides = computed(() => [-1, 0, 1].reduce<Slide[]>((list, step) => {
		const index = indexOf(step);
		if (index < 0) return list;
		const isMirror = count.value === 2 && step !== 0 && step !== lead.value;
		list.push({
			index,
			step,
			key: isMirror ? `${index}:mirror` : index,
			isActive: step === 0,
			isAnimated: index === openedIndex && !isNavigated.value,
			triggerElement: triggerElementOf(index),
			style: { transform: `translate3d(${step * 100}%, 0, 0)` }
		});
		return list;
	}, []));

	const classes = computed(() => [
		'vc-file-viewer',
		{
			'is-zoom': isZoom.value,
			'is-open': isOpen.value,
			'is-loading': isLoading.value,
			'is-idle': isIdle.value,
			'is-dragging': isDragging.value
		}
	]);
	const stageStyle = computed(() => ({ transform: `translate3d(${offset.value.x}px, ${offset.value.y}px, 0)` }));
	const bgStyle = computed(() => (dim.value < 1 ? { '--vc-file-viewer-dim': dim.value } : void 0));

	const slideTo = async (x: number) => {
		isSliding.value = true;
		offset.value = { x, y: 0 };
		await waitTransition(stage.value);
		isSliding.value = false;
	};

	const go = async (step: number) => {
		const index = indexOf(step);
		if (isSliding.value || isClosing || index < 0) return;
		isNavigated.value = true;
		// 打开的那一项还在加载时切走：不再等它，直接整层打开
		isWaiting = false;
		isLoading.value && (isLoading.value = false, isOpen.value = true);
		// 两项时先把已渲染的那份挪到滑入的一侧，和位移同一拍生效
		count.value === 2 && (lead.value = step);
		await slideTo(-step * viewport.value.w);
		// 切换途中关闭了：留在原来的一项，缩回它的触发元素
		if (isClosing) return;
		// 函数 ref 切走时不会置空：先清掉，新的当前项渲染时再登记。自定义页、非图片页就留空
		activeReveal.value = null;
		activeImage.value = null;
		current.value = index;
		offset.value = { x: 0, y: 0 };
	};

	// 开合过渡开始的那一拍：蒙层、工具栏和画面一起动
	const handleAnimate = () => {
		isOpen.value = !isClosing;
		isWaiting = false;
		isLoading.value = false;
	};

	// 挂载、插入文档后再显示：先读一次布局，蒙层才会从接近透明淡入，而不是一出现就压暗
	const showLoading = () => {
		if (!isWaiting || isClosing || isOpen.value) return;
		reflow(root.value);
		isLoading.value = true;
	};

	const handleWait = () => {
		isWaiting = true;
		isMounted && showLoading();
	};

	const close = async () => {
		if (isClosing) return;
		isClosing = true;
		gesture.cancel();
		isDragging.value = false;
		// 切换途中关闭：舞台停在此刻画到的位置（铺满根元素，两者盒子之差就是位移），渲染后再按这里量
		if (isSliding.value && stage.value && root.value) {
			const now = stage.value.getBoundingClientRect();
			const box = root.value.getBoundingClientRect();
			offset.value = { x: now.left - box.left, y: now.top - box.top };
			isSliding.value = false;
			await nextTick();
		}
		// 拖动停在哪就从哪缩回：舞台不归零，窗口和画面按当前的位置量；缩不回去（没有触发元素或量不到）时淡出
		activeReveal.value && activeImage.value?.straighten();
		// 还在加载、没放大过的：整层淡出
		const leaving = !isLoading.value && activeReveal.value?.leave();
		if (leaving) {
			await leaving;
		} else {
			isZoom.value = false;
			isOpen.value = false;
			isWaiting = false;
			isLoading.value = false;
			await waitTransition(root.value);
		}
		isVisible.value = false;
		props.onClose?.();
		previous?.isConnected && previous.focus();
		onFulfilled();
	};

	const isMedia = (target: EventTarget | null) => target instanceof Element && !!target.closest('.vc-image-slide__media');

	const handleMoveStart = ({ axis }: GestureMoveStartEvent) => {
		if (isSliding.value || isClosing) return;
		mode = activeImage.value?.isZoomed ? 'pan' : axis === 'y' ? 'close' : 'swipe';
		isDragging.value = mode === 'close';
		base = 0;
	};

	const handleMove = ({ deltaX, deltaY, offsetX, offsetY }: GestureMoveEvent) => {
		if (mode === 'pan') {
			const leftover = activeImage.value?.panBy(deltaX, deltaY) || 0;
			if (!leftover) return;
			// 平移到边缘后剩余的位移转为切换
			mode = 'swipe';
			base = offsetX - leftover;
		}
		if (mode === 'swipe') {
			const x = offsetX - base;
			const isEdge = (x > 0 && !hasPrev.value) || (x < 0 && !hasNext.value);
			offset.value = { x: isEdge ? x * EDGE_RESISTANCE : x, y: 0 };
		} else if (mode === 'close') {
			const y = offsetY * VERTICAL_DRAG_FRICTION;
			offset.value = { x: 0, y };
			dim.value = clamp01(1 - Math.abs(y) / (viewport.value.h / 3));
		}
	};

	const handleMoveEnd = ({ velocityX, velocityY, canceled }: GestureMoveEndEvent) => {
		const last = mode;
		mode = null;
		isDragging.value = false;
		const { x, y } = offset.value;
		if (last === 'swipe') {
			const isNext = x < 0 && (x <= -SWIPE_DISTANCE || velocityX < -FLICK_VELOCITY);
			const isPrev = x > 0 && (x >= SWIPE_DISTANCE || velocityX > FLICK_VELOCITY);
			const step = canceled ? 0 : isNext ? 1 : isPrev ? -1 : 0;
			void (step && indexOf(step) >= 0 ? go(step) : slideTo(0));
		} else if (last === 'close') {
			// 速度是手指速度，加在已经乘过阻尼的位移上，和 PhotoSwipe 的投影一致
			const flung = y + velocityY * VERTICAL_PROJECT;
			const limit = (viewport.value.h / 3) * MIN_RATIO_TO_CLOSE;
			if (!canceled && ((y < 0 && flung < -limit) || (y > 0 && flung > limit))) {
				void close();
				return;
			}
			dim.value = 1;
			void slideTo(0);
		}
	};

	const handlePinchStart = ({ center }: GesturePinchEvent) => {
		if (isClosing) return;
		mode = 'pinch';
		pinchRatio = 1;
		isDragging.value = true;
		activeImage.value?.pinchStart(center);
	};

	const handlePinch = ({ scale, center }: GesturePinchEvent) => {
		if (mode !== 'pinch') return;
		pinchRatio = activeImage.value?.pinch(scale, center) ?? 1;
		// 双指缩小到初始尺寸以下时，按超出的比例压暗蒙层
		dim.value = pinchRatio < 1 ? clamp01(1 - (1 - pinchRatio) * 1.2) : 1;
	};

	const handlePinchEnd = () => {
		if (mode !== 'pinch') return;
		mode = null;
		isDragging.value = false;
		if (pinchRatio < PINCH_CLOSE) {
			void close();
			return;
		}
		dim.value = 1;
		activeImage.value?.pinchEnd();
	};

	// 点图片：鼠标缩放，触屏切换工具栏。点空白（蒙层）一律关闭，文件信息栏除外
	const handleTap = ({ target, pointerType, x, y }: GestureTapEvent) => {
		if (isClosing) return;
		if (isMedia(target)) {
			if (pointerType === 'mouse') activeImage.value?.toggleZoom({ x, y });
			else isIdle.value = !isIdle.value;
			return;
		}
		if (target instanceof Element && target.closest('.vc-file-slide__meta')) return;
		void close();
	};

	const handleDoubleTap = ({ target, x, y }: GestureTapEvent) => {
		isMedia(target) && activeImage.value?.toggleZoom({ x, y });
	};

	const gesture = useGesture({
		ignore: IGNORE,
		moveStart: handleMoveStart,
		move: handleMove,
		moveEnd: handleMoveEnd,
		pinchStart: handlePinchStart,
		pinch: handlePinch,
		pinchEnd: handlePinchEnd,
		tap: handleTap,
		doubleTap: handleDoubleTap,
		immediateTap: e => !isMedia(e.target),
		wheel: ({ deltaY, x, y }) => activeImage.value?.zoomBy(Math.exp(-deltaY * WHEEL_RATE), { x, y })
	});

	// Tab 只在查看器内循环；关闭按钮始终存在，不会为空
	const trap = (e: KeyboardEvent) => {
		const nodes = [...root.value!.querySelectorAll<HTMLElement>(FOCUSABLE)];
		const first = nodes[0];
		const last = nodes[nodes.length - 1];
		const edge = e.shiftKey ? first : last;
		if (document.activeElement !== edge && root.value?.contains(document.activeElement)) return false;
		(e.shiftKey ? last : first).focus();
		return true;
	};

	// 由统一的 Keyboard 分发：查看器开在弹层上时，Esc 只关闭查看器
	const handleKeyboard = (e: KeyboardEvent) => {
		if (e.isComposing || (e.target instanceof Element && e.target.closest(EDITABLE))) return false;
		if (e.key === 'Escape') {
			void close();
			return true;
		}
		if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
			void go(e.key === 'ArrowLeft' ? -1 : 1);
			return true;
		}
		return e.key === 'Tab' && trap(e);
	};

	useKeyboard({ enabled: () => isVisible.value, handler: handleKeyboard, flush: 'post' });

	const handleResize = () => {
		viewport.value = { w: window.innerWidth, h: window.innerHeight };
	};

	onMounted(async () => {
		window.addEventListener('resize', handleResize);
		// Portal 挂载完才把节点插入文档：插入后再聚焦；从元素放大时由 Reveal 在放大那一拍打开
		await nextTick();
		isMounted = true;
		root.value?.querySelector<HTMLElement>('.vc-file-viewer__close')?.focus();
		if (isZoom.value && activeReveal.value) return showLoading();
		reflow(root.value);
		isOpen.value = true;
	});

	onBeforeUnmount(() => {
		window.removeEventListener('resize', handleResize);
	});

	return {
		root,
		stage,
		activeReveal,
		activeImage,
		current,
		count,
		row,
		imageOptions,
		viewport,
		isSliding,
		slides,
		classes,
		stageStyle,
		bgStyle,
		hasPrev,
		hasNext,
		listeners: gesture.listeners,
		go,
		close,
		handleAnimate,
		handleWait,
		isLoading
	};
};
