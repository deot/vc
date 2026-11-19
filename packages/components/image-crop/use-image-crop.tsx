/** @jsxImportSource vue */

import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import type { SetupContext } from 'vue';
import { debounce } from 'lodash-es';
import { Resize } from '@deot/helper-resize';
import { useGesture } from '@deot/vc-hooks';
import type { GestureMoveEvent, GestureMoveStartEvent, GesturePinchEvent, GestureWheelEvent } from '@deot/vc-hooks';
import { VcError } from '../vc';
import { isBlob, loadImage, readBlobAsDataUrl } from '../image-processor/utils';
import {
	clampTransform,
	drawCrop,
	fitRect,
	fromCropData,
	getBoundingSize,
	getCenter,
	getCoverScale,
	isCovered,
	isInside,
	mapTransform,
	resizeRect,
	rotateAt,
	searchValid,
	toCropData,
	zoomAt
} from './geometry';
import type { Direction, Point, Rect, Size, Transform } from './geometry';
import type {
	ImageCropCanvasOptions,
	ImageCropData,
	ImageCropImageOptions,
	ImageCropImageResult,
	Props
} from './image-crop-props';

type Emits = ['load', 'error', 'change', 'update:zoom', 'update:rotate'];

export const emits: Emits = ['load', 'error', 'change', 'update:zoom', 'update:rotate'];

const DIRECTIONS: Direction[] = ['n', 'e', 's', 'w', 'nw', 'ne', 'sw', 'se'];
// 裁剪框最小边长（舞台 px）
const MIN_SIZE = 40;
// 滚轮每像素的缩放指数，同 FilePreview 查看器
const WHEEL_RATE = 0.002;
const KEY_MOVES: Record<string, [number, number]> = {
	ArrowLeft: [-1, 0],
	ArrowRight: [1, 0],
	ArrowUp: [0, -1],
	ArrowDown: [0, 1]
};
const EMPTY_RECT: Rect = { x: 0, y: 0, width: 0, height: 0 };

const round = (value: number) => Math.round(value * 1e4) / 1e4;

/**
 * ImageCrop 与 MImageCrop 共用：DOM 渲染（图片 transform + CSS 遮罩），只在导出时用 canvas
 * - 图片始终铺满裁剪框；zoom 为 1 时刚好铺满（按当前角度）
 * - resizable：拖边、拖角调整裁剪框，松开后裁剪框回到舞台中适配的大小，图片跟着缩放（内容不变）
 * - 拖动平移，滚轮（桌面端）与双指缩放，方向键平移、+ / - 缩放
 * @param props ~
 * @param context ~
 * @param options ~
 * @param options.mobile 移动端（MImageCrop）：根节点加标记类 vcm-image-crop，不监听滚轮
 * @returns render
 */
export const useImageCrop = (
	props: Props,
	context: SetupContext<Emits>,
	options: { mobile?: boolean } = {}
) => {
	const { emit, expose } = context;
	const { mobile } = options;
	const name = mobile ? 'vc-image-crop vcm-image-crop' : 'vc-image-crop';

	const area = ref<HTMLElement>();
	const image = shallowRef<HTMLImageElement | null>(null);
	const frame = shallowRef<Rect>(EMPTY_RECT);
	const transform = shallowRef<Transform>({ x: 0, y: 0, scale: 1, rotate: props.rotate });
	const isActive = ref(false);
	// 松开后回中、还原、按钮转 90° 时为 true；下一次 apply（任何交互）清掉
	const isAnimating = ref(false);

	// 内边距以内的区域：裁剪框的活动范围
	let bounds: Rect = EMPTY_RECT;
	// 图片已按舞台定位（隐含图片已加载）
	let isPlaced = false;
	let objectURL = '';
	let loadId = 0;

	const getSize = (): Size => ({
		width: image.value?.naturalWidth || 0,
		height: image.value?.naturalHeight || 0
	});

	const getCover = (rect = frame.value, rotate = transform.value.rotate) => getCoverScale(rect, getSize(), rotate);

	const getZoom = () => transform.value.scale / getCover();

	const clampScale = (scale: number, rotate = transform.value.rotate) => {
		const cover = getCover(frame.value, rotate);
		return Math.min(Math.max(scale, cover), cover * Math.max(1, props.maxZoom));
	};

	// 与上次发出（或传入）的值比较：未绑定 v-model 时 props.zoom 不变，回到原值也要发出
	let lastZoom = props.zoom;
	const emitZoom = () => {
		const zoom = round(getZoom());
		if (zoom === lastZoom) return;
		lastZoom = zoom;
		emit('update:zoom', zoom);
	};

	const getData = (): ImageCropData | null => {
		if (!isPlaced) return null;
		return toCropData(transform.value, frame.value, getSize());
	};

	const emitChange = () => {
		const data = getData();
		data && emit('change', data);
	};

	// 连续的滚轮、键盘只在停下后发出 change
	const emitChangeLater = debounce(emitChange, 200);

	const apply = (next: Transform) => {
		isAnimating.value = false;
		transform.value = clampTransform({ ...next, scale: clampScale(next.scale, next.rotate) }, frame.value, getSize());
		emitZoom();
	};

	// 图片按 rotate 旋转后的宽高比
	const getImageRatio = (rotate = transform.value.rotate) => {
		const size = getBoundingSize(getSize(), rotate);
		return size.width && size.height ? size.width / size.height : 1;
	};

	// 裁剪框按比例重新适配舞台，图片跟着映射（框内内容不变）
	const refit = (ratio: number) => {
		const next = fitRect(bounds, ratio);
		const mapped = mapTransform(transform.value, frame.value, next);
		frame.value = next;
		apply(mapped);
	};

	// 定位：裁剪框适配舞台，图片按 zoom、rotate 居中
	const place = (rotate = props.rotate || 0, zoom = props.zoom) => {
		frame.value = fitRect(bounds, props.aspectRatio || getImageRatio(rotate));
		const scale = getCover(frame.value, rotate) * Math.min(Math.max(zoom, 1), Math.max(1, props.maxZoom));
		isPlaced = true;
		apply({ ...getCenter(frame.value), rotate, scale });
	};

	// 舞台尺寸变化
	const layout = () => {
		const el = area.value;
		/* istanbul ignore next -- guarded for calls before mount. */
		if (!el) return;
		bounds = { x: el.offsetLeft, y: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight };
		if (!bounds.width || !bounds.height) return;
		if (!image.value) {
			frame.value = fitRect(bounds, props.aspectRatio || 1);
			return;
		}
		if (!isPlaced) return place();
		// 不限比例：可调整时沿用当前裁剪框的比例，否则取图片的比例
		const { width, height } = frame.value;
		refit(props.aspectRatio || (props.resizable ? width / height : getImageRatio()));
	};

	const setRotate = (rotate: number) => {
		const current = transform.value;
		if (rotate === current.rotate) return;
		const zoom = getZoom();
		const center = getCenter(frame.value);
		apply(zoomAt(rotateAt(current, rotate, center), getCover(frame.value, rotate) * zoom, center));
	};

	// 以裁剪框中心缩放
	const setZoom = (zoom: number) => {
		apply(zoomAt(transform.value, clampScale(zoom * getCover()), getCenter(frame.value)));
	};

	const revoke = () => {
		objectURL && URL.revokeObjectURL(objectURL);
		objectURL = '';
	};

	const load = (src: Props['src']) => {
		const id = ++loadId;
		revoke();
		isPlaced = false;
		if (!src) {
			image.value = null;
			layout();
			return;
		}
		let url = src as string;
		if (isBlob(src)) {
			objectURL = URL.createObjectURL(src);
			url = objectURL;
		}
		loadImage(url, props.crossOrigin).then((target) => {
			if (id !== loadId) return;
			image.value = target;
			layout();
			emit('load', target);
			emitChange();
		}).catch((error) => {
			id === loadId && emit('error', error);
		});
	};

	// 手势：按下的是手柄时调整裁剪框，否则平移图片
	let direction: Direction | null = null;
	let startFrame: Rect = EMPTY_RECT;
	let pinchScale = 1;
	let pinchCenter: Point = { x: 0, y: 0 };

	const resize = (e: GestureMoveEvent) => {
		const size = getSize();
		const min = Math.min(MIN_SIZE, bounds.width, bounds.height);
		const ratio = props.aspectRatio || null;
		frame.value = searchValid(
			t => resizeRect(startFrame, direction!, e.offsetX * t, e.offsetY * t, ratio),
			rect => (
				rect.width >= min
				&& rect.height >= min
				&& isInside(rect, bounds)
				&& isCovered(transform.value, rect, size)
			)
		);
	};

	const end = () => {
		if (!isActive.value) return;
		isActive.value = false;
		if (direction) {
			refit(frame.value.width / frame.value.height);
			isAnimating.value = true;
		}
		direction = null;
		emitChange();
	};

	const handleMoveStart = (e: GestureMoveStartEvent) => {
		const value = (e.target as HTMLElement | null)?.dataset?.direction;
		direction = props.resizable && value ? value as Direction : null;
		isActive.value = true;
		isAnimating.value = false;
		startFrame = frame.value;
	};

	const handleMove = (e: GestureMoveEvent) => {
		if (direction) return resize(e);
		const current = transform.value;
		apply({ ...current, x: current.x + e.deltaX, y: current.y + e.deltaY });
	};

	const handlePinchStart = (e: GesturePinchEvent) => {
		// 调整裁剪框时按下第二根手指：先按松开处理
		end();
		isActive.value = true;
		isAnimating.value = false;
		pinchScale = 1;
		pinchCenter = e.center;
	};

	// 以双指中心缩放，并跟随双指中心移动
	const handlePinch = (e: GesturePinchEvent) => {
		const current = transform.value;
		const next = zoomAt(current, clampScale(current.scale * (e.scale / pinchScale)), e.center);
		pinchScale = e.scale;
		apply({ ...next, x: next.x + e.center.x - pinchCenter.x, y: next.y + e.center.y - pinchCenter.y });
		pinchCenter = e.center;
	};

	const handleWheel = (e: GestureWheelEvent) => {
		const current = transform.value;
		apply(zoomAt(current, clampScale(current.scale * Math.exp(-e.deltaY * WHEEL_RATE)), e));
		emitChangeLater();
	};

	const gesture = useGesture({
		threshold: 0,
		moveStart: handleMoveStart,
		move: handleMove,
		moveEnd: end,
		pinchStart: handlePinchStart,
		pinch: handlePinch,
		pinchEnd: end,
		// 移动端不监听滚轮
		wheel: mobile ? undefined : handleWheel
	});

	// 图片未定位时不响应手势
	const handlePointerdown = (e: PointerEvent) => {
		isPlaced && gesture.listeners.onPointerdown(e);
	};

	const listeners = { ...gesture.listeners, onPointerdown: handlePointerdown };

	const handleKeydown = (e: KeyboardEvent) => {
		if (!isPlaced || e.isComposing) return;
		const move = KEY_MOVES[e.key];
		const current = transform.value;
		if (move) {
			const step = e.shiftKey ? 1 : 10;
			apply({ ...current, x: current.x + move[0] * step, y: current.y + move[1] * step });
		} else if (e.key === '+' || e.key === '=') {
			setZoom(getZoom() * 1.1);
		} else if (e.key === '-' || e.key === '_') {
			setZoom(getZoom() / 1.1);
		} else {
			return;
		}
		e.preventDefault();
		emitChangeLater();
	};

	/**
	 * 恢复上一次的裁剪（getData 的结果）
	 * @param data ~
	 */
	const setData = (data: ImageCropData) => {
		if (!isPlaced || !data?.width || !data?.height) return;
		if (props.resizable && !props.aspectRatio) {
			frame.value = fitRect(bounds, data.width / data.height);
		}
		apply(fromCropData(data, frame.value, getSize()));
		const { rotate } = transform.value;
		rotate !== props.rotate && emit('update:rotate', rotate);
		emitChange();
	};

	/**
	 * 裁剪结果画到 canvas；图片未加载时为 null
	 * @param canvasOptions ~
	 * @returns ~
	 */
	const getCanvas = (canvasOptions: ImageCropCanvasOptions = {}) => {
		const data = getData();
		if (!data) return null;
		const { width, height, fillColor } = canvasOptions;
		const canvas = document.createElement('canvas');
		canvas.width = Math.max(1, Math.round(width || (height ? (height * data.width) / data.height : data.width)));
		canvas.height = Math.max(1, Math.round(height || (width ? (width * data.height) / data.width : data.height)));
		const ctx = canvas.getContext('2d');
		/* istanbul ignore next -- canvas 2d is always available in browsers. */
		if (!ctx) return canvas;
		if (fillColor) {
			ctx.fillStyle = fillColor;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		}
		ctx.imageSmoothingQuality = 'high';
		drawCrop(ctx, image.value!, data, getSize());
		return canvas;
	};

	/**
	 * 裁剪结果转为图片：toBlob 编码（不阻塞主线程），传 filename 时同时生成 File
	 * @param imageOptions ~
	 * @returns ~
	 */
	const getImage = async (imageOptions: ImageCropImageOptions = {}): Promise<ImageCropImageResult> => {
		const { type = 'image/png', quality, filename, ...canvasOptions } = imageOptions;
		const canvas = getCanvas(canvasOptions);
		if (!canvas) throw new VcError('image-crop', '图片未加载');
		const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality));
		if (!blob) throw new VcError('image-crop', '图片导出失败');
		const dataURL = await readBlobAsDataUrl(blob);
		return typeof filename === 'string'
			? { dataURL, file: new File([blob], filename, { type: blob.type }) }
			: { dataURL };
	};

	// 回到初始：zoom 1、角度 0、裁剪框适配舞台
	const reset = () => {
		if (!isPlaced) return;
		props.rotate && emit('update:rotate', 0);
		place(0, 1);
		isAnimating.value = true;
		emitChange();
	};

	watch(() => props.src, load);
	watch(() => props.rotate, (v, old) => {
		if (!isPlaced) return;
		setRotate(v || 0);
		// 按钮一次转 90° 时有动画，滑块连续拖动时没有
		isAnimating.value = Math.abs((v || 0) - (old || 0)) >= 45;
		emitChangeLater();
	});
	watch(() => props.zoom, (v) => {
		lastZoom = v;
		if (!isPlaced || round(getZoom()) === v) return;
		setZoom(v);
		emitChangeLater();
	});
	watch(() => props.maxZoom, () => isPlaced && apply(transform.value));
	watch([() => props.aspectRatio, () => props.resizable], () => {
		if (!isPlaced) return layout();
		// 换比例：按新比例（不限时取图片的比例）适配
		refit(props.aspectRatio || getImageRatio());
		emitChange();
	});

	onMounted(() => {
		area.value && Resize.on(area.value, layout);
		layout();
		load(props.src);
	});

	onBeforeUnmount(() => {
		area.value && Resize.off(area.value, layout);
		emitChangeLater.cancel();
		loadId++;
		revoke();
	});

	expose({
		getData,
		setData,
		getCanvas,
		getImage,
		reset
	});

	const getImageStyle = () => {
		const { width, height } = getSize();
		const { x, y, scale, rotate } = transform.value;
		const w = width * scale;
		const h = height * scale;
		return {
			width: `${w}px`,
			height: `${h}px`,
			transform: `translate(${x - w / 2}px, ${y - h / 2}px) rotate(${rotate}deg)`
		};
	};

	const getFrameStyle = () => {
		const { x, y, width, height } = frame.value;
		return {
			width: `${width}px`,
			height: `${height}px`,
			transform: `translate(${x}px, ${y}px)`
		};
	};

	const renderImage = () => {
		const target = image.value;
		if (!target || !isPlaced) return;
		return (
			<img
				class="vc-image-crop__image"
				src={target.src}
				crossorigin={(target.crossOrigin || undefined) as Props['crossOrigin'] | undefined}
				alt=""
				draggable={false}
				style={getImageStyle()}
			/>
		);
	};

	const renderHandles = () => {
		if (!props.resizable || props.disabled) return;
		return DIRECTIONS.map(item => (
			<span key={item} class={['vc-image-crop__handle', `is-${item}`]} data-direction={item} />
		));
	};

	return () => {
		const { disabled } = props;
		return (
			<div
				class={[name, {
					'is-active': isActive.value,
					'is-animating': isAnimating.value,
					'is-disabled': disabled,
					'is-resizable': props.resizable
				}]}
				tabindex={disabled ? undefined : 0}
				onKeydown={disabled ? undefined : handleKeydown}
				{...(disabled ? {} : listeners)}
			>
				<div ref={area} class="vc-image-crop__area" />
				{renderImage()}
				<div class={['vc-image-crop__frame', { 'is-circle': props.shape === 'circle' }]} style={getFrameStyle()}>
					{renderHandles()}
				</div>
			</div>
		);
	};
};
