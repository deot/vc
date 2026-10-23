import { computed, ref, shallowRef, watch } from 'vue';
import type { Ref } from 'vue';
import type { FilePreviewImageFit } from '../../types';
import type { Point, Size } from '../utils';
import { clampFrame, fitFrame, getBaseScale, orientedSize, pan, zoomAt } from './utils';
import type { Frame } from './utils';

type ZoomProps = {
	viewport: Size;
	fit: FilePreviewImageFit;
	/** 相对初始尺寸的最大倍数 */
	max: number;
	/** 相对初始尺寸的最小倍数 */
	min: number;
};

// 放大、缩小按钮每次乘或除以该倍数
const STEP = 2;

/**
 * 图片的位置、缩放和旋转。
 * 单击在初始尺寸与 4 倍（不超过 max）之间切换。
 * 放大、缩小按钮每次 2 倍，稳定范围是初始尺寸的 min～max 倍，默认 1～10。
 * 捏合可临时缩到初始尺寸的一半，用于关闭反馈。旋转每次 90°，保持相对初始尺寸的倍率并重新居中。
 * @param props 视口、fit 与缩放倍数
 * @param natural 图片自然尺寸
 * @returns 当前 frame 与缩放、旋转、平移操作
 */
export const useZoom = (props: ZoomProps, natural: Ref<Size | null>) => {
	const frame = shallowRef<Frame | null>(null);
	const isAnimating = ref(false);
	const rotation = ref(0);
	let pinchFrom: { frame: Frame; center: Point } | null = null;

	const sizeOf = () => (natural.value ? orientedSize(natural.value, rotation.value) : null);

	// 倍数由查看器收成正数且下限不超过上限
	const levels = computed(() => {
		const size = sizeOf();
		const initial = size ? getBaseScale(size, props.viewport, props.fit) : 1;
		const max = initial * props.max;
		const min = initial * props.min;
		return {
			initial,
			secondary: initial * Math.min(4, props.max),
			max,
			min,
			pinch: Math.min(min, initial / 2)
		};
	});
	const isZoomed = computed(() => !!frame.value && frame.value.scale > levels.value.initial * 1.01);
	const canZoomIn = computed(() => !!frame.value && frame.value.scale < levels.value.max * 0.999);
	const canZoomOut = computed(() => !!frame.value && frame.value.scale > levels.value.min * 1.001);

	const apply = (next: Frame, animate = false) => {
		isAnimating.value = animate;
		frame.value = next;
	};

	const center = () => ({ x: props.viewport.w / 2, y: props.viewport.h / 2 });

	// 保持相对初始尺寸的倍率，不低于稳定下限，也不超过上限；下限高于初始尺寸时仍允许停在初始尺寸
	const fitScale = (ratio: number) => {
		const { initial, max, min } = levels.value;
		return Math.min(max, Math.max(Math.min(min, initial), initial * ratio));
	};

	const reset = (animate = false) => {
		const size = sizeOf();
		size && apply(fitFrame(size, props.viewport, levels.value.initial), animate);
	};

	const zoomTo = (scale: number, origin = center(), animate = false) => {
		const size = sizeOf();
		if (!size || !frame.value) return;
		const { min, max } = levels.value;
		apply(clampFrame(zoomAt(frame.value, scale, origin, min, max), size, props.viewport), animate);
	};

	const toggleZoom = (origin?: Point) => {
		isZoomed.value ? reset(true) : zoomTo(levels.value.secondary, origin, true);
	};

	const zoomBy = (factor: number, origin?: Point) => {
		frame.value && zoomTo(frame.value.scale * factor, origin);
	};

	const zoomIn = () => {
		if (!frame.value || !canZoomIn.value) return;
		zoomTo(frame.value.scale * STEP, center(), true);
	};

	const zoomOut = () => {
		if (!frame.value || !canZoomOut.value) return;
		zoomTo(frame.value.scale / STEP, center(), true);
	};

	const panBy = (dx: number, dy: number) => {
		const size = sizeOf();
		if (!size || !frame.value) return 0;
		const moved = pan(frame.value, { x: dx, y: dy }, size, props.viewport);
		apply(moved.frame);
		return moved.leftover;
	};

	const pinchStart = (origin: Point) => {
		pinchFrom = frame.value && { frame: frame.value, center: origin };
	};

	/**
	 * 捏合：以起始中心缩放，中心移动时一起平移
	 * @param scale 相对捏合开始的倍率
	 * @param origin 当前双指中心
	 * @returns 相对初始尺寸的倍率，小于 1 表示缩到了初始以下
	 */
	const pinch = (scale: number, origin: Point) => {
		const size = sizeOf();
		if (!pinchFrom || !size) return 1;
		const { initial, max, pinch: floor } = levels.value;
		const target = pinchFrom.frame.scale * scale;
		const zoomed = zoomAt(pinchFrom.frame, target, pinchFrom.center, floor, max);
		const moved = { ...zoomed, x: zoomed.x + origin.x - pinchFrom.center.x, y: zoomed.y + origin.y - pinchFrom.center.y };
		apply(moved.scale < initial ? moved : clampFrame(moved, size, props.viewport));
		return target / initial;
	};

	// 松手：缩到稳定下限以下时回到下限（默认即初始尺寸），否则收回到视口内
	const pinchEnd = () => {
		pinchFrom = null;
		const size = sizeOf();
		if (!size || !frame.value) return;
		const { initial, min } = levels.value;
		if (frame.value.scale < min) {
			min < initial ? zoomTo(min, center(), true) : reset(true);
			return;
		}
		apply(clampFrame(frame.value, size, props.viewport), true);
	};

	const rotateBy = (delta: number) => {
		const current = natural.value;
		if (!current || !frame.value) return;
		const prev = orientedSize(current, rotation.value);
		const prevBase = getBaseScale(prev, props.viewport, props.fit) || 1;
		const ratio = frame.value.scale / prevBase;
		rotation.value += delta;
		const next = orientedSize(current, rotation.value);
		apply(clampFrame(fitFrame(next, props.viewport, fitScale(ratio)), next, props.viewport), true);
	};

	// 关闭动画按未旋转的图片回到缩略图，先转回 0° 并保住画面中心
	const straighten = () => {
		const current = natural.value;
		if (!rotation.value || !current || !frame.value) return;
		const prev = orientedSize(current, rotation.value);
		const prevBase = getBaseScale(prev, props.viewport, props.fit) || 1;
		const ratio = frame.value.scale / prevBase;
		const cx = frame.value.x + (prev.w * frame.value.scale) / 2;
		const cy = frame.value.y + (prev.h * frame.value.scale) / 2;
		rotation.value = 0;
		const scale = fitScale(ratio);
		apply(clampFrame({
			x: cx - (current.w * scale) / 2,
			y: cy - (current.h * scale) / 2,
			scale
		}, current, props.viewport));
	};

	/**
	 * 尺寸由缩略图换成大图：按新比例放进原来的盒子，同比例时画面不动
	 * @param prev 原来的尺寸
	 * @returns 是否已在初始位置；比例不同或 fit 为 actual 时还要再过渡过去
	 */
	const refit = (prev: Size) => {
		const size = sizeOf();
		const current = frame.value;
		if (!size || !current) return true;
		const from = orientedSize(prev, rotation.value);
		const w = from.w * current.scale;
		const h = from.h * current.scale;
		const scale = Math.min(w / size.w, h / size.h);
		apply({ x: current.x + (w - size.w * scale) / 2, y: current.y + (h - size.h * scale) / 2, scale });
		return Math.abs(scale / levels.value.initial - 1) < 0.01;
	};

	// 有尺寸就放到初始位置
	watch(natural, () => !frame.value && reset(), { immediate: true });

	// 视口、fit 或倍数变化：重新适配，保持相对初始尺寸的倍率
	watch(
		[() => props.viewport, () => props.fit, () => props.max, () => props.min],
		([viewport], [prevViewport, prevFit]) => {
			const size = sizeOf();
			if (!size || !frame.value) return;
			const prevBase = getBaseScale(size, prevViewport, prevFit);
			const ratio = prevBase ? frame.value.scale / prevBase : 1;
			apply(clampFrame(fitFrame(size, viewport, fitScale(ratio)), size, viewport));
		}
	);

	return {
		frame,
		rotation,
		isAnimating,
		isZoomed,
		canZoomIn,
		canZoomOut,
		reset,
		refit,
		toggleZoom,
		zoomBy,
		zoomIn,
		zoomOut,
		rotateBy,
		straighten,
		panBy,
		pinchStart,
		pinch,
		pinchEnd
	};
};
