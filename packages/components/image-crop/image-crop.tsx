/** @jsxImportSource vue */

import { computed, defineComponent, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { canvasToImage } from '@deot/helper-utils';
import { Resize } from '@deot/helper-resize';
import { IS_SERVER } from '@deot/vc-shared';
import { props as imageCropProps } from './image-crop-props';
import {
	appendTimestamp,
	drawRoundedRect,
	getPointer,
	isBlob,
	isDataURL,
	normalizeBorder,
	normalizeMaskColor,
	normalizeOutputSize,
	retrieveImageURL
} from './utils';
import type {
	ImageCropBorder,
	ImageCropDimensions,
	ImageCropGetImageOptions,
	ImageCropImageState,
	ImageCropPosition,
	ImageCropRect,
	ImageCropSource
} from './image-crop-props';

const COMPONENT_NAME = 'vc-image-crop';

const draggableEvents = {
	start: ['touchstart', 'mousedown'],
	move: ['touchmove', 'mousemove'],
	end: ['touchend', 'touchcancel', 'mouseup']
} as const;

export const ImageCrop = defineComponent({
	name: COMPONENT_NAME,
	props: imageCropProps,
	emits: [
		'image-load',
		'image-error',
		'image-change',
		'image-drop',
		'position-change',
		'mousemove',
		'mouseup'
	],
	setup(props, { emit, expose }) {
		const canvas = ref<HTMLCanvasElement>();
		const dragging = ref(false);
		const lastX = ref<number | null>(null);
		const lastY = ref<number | null>(null);
		const elementWidth = ref(0);
		const elementHeight = ref(0);
		const image = shallowRef<ImageCropImageState>({
			resource: null,
			x: 0.5,
			y: 0.5,
			width: 0,
			height: 0
		});

		const outputSize = computed(() => normalizeOutputSize(props.outputSize));
		const outputWidth = computed(() => outputSize.value[0]);
		const outputHeight = computed(() => outputSize.value[1]);
		const outputRatio = computed(() => outputWidth.value / outputHeight.value);

		const canvasStyle = computed(() => ({
			cursor: dragging.value ? 'grabbing' : 'grab'
		}));

		const getBorders = (border = props.border) => normalizeBorder(border);

		const getXScale = () => {
			if (!image.value.width || !image.value.height) return 1;

			const canvasAspect = outputWidth.value / outputHeight.value;
			const imageAspect = image.value.width / image.value.height;
			return Math.min(1, canvasAspect / imageAspect);
		};

		const getYScale = () => {
			if (!image.value.width || !image.value.height) return 1;

			const canvasAspect = outputHeight.value / outputWidth.value;
			const imageAspect = image.value.height / image.value.width;
			return Math.min(1, canvasAspect / imageAspect);
		};

		const getCroppingRect = (): ImageCropRect => {
			const scale = props.scale || 1;
			const position: ImageCropPosition = props.position || {
				x: image.value.x,
				y: image.value.y
			};
			const width = (1 / scale) * getXScale();
			const height = (1 / scale) * getYScale();
			const croppingRect = {
				x: position.x - width / 2,
				y: position.y - height / 2,
				width,
				height
			};
			let xMin = 0;
			let xMax = 1 - croppingRect.width;
			let yMin = 0;
			let yMax = 1 - croppingRect.height;

			if (width > 1 || height > 1) {
				xMin = -croppingRect.width;
				xMax = 1;
				yMin = -croppingRect.height;
				yMax = 1;
			}

			return {
				...croppingRect,
				x: Math.max(xMin, Math.min(croppingRect.x, xMax)),
				y: Math.max(yMin, Math.min(croppingRect.y, yMax))
			};
		};

		const calculatePosition = (source: ImageCropImageState, border: ImageCropBorder) => {
			const [borderX, borderY] = getBorders(border);
			const croppingRect = getCroppingRect();
			const scale = props.scale || 1;
			const width = source.width * scale;
			const height = source.height * scale;

			return {
				x: (-croppingRect.x * width) + borderX,
				y: (-croppingRect.y * height) + borderY,
				width,
				height
			};
		};

		const paintImage = (context: CanvasRenderingContext2D, source: ImageCropImageState, border: ImageCropBorder) => {
			if (!source.resource) return;

			const position = calculatePosition(source, border);

			context.save();
			context.translate(context.canvas.width / 2, context.canvas.height / 2);
			context.rotate((props.rotate * Math.PI) / 180);
			context.translate(-(context.canvas.width / 2), -(context.canvas.height / 2));
			context.scale(1, 1);
			context.globalCompositeOperation = 'destination-over';
			context.drawImage(
				source.resource,
				position.x,
				position.y,
				position.width,
				position.height
			);
			context.restore();
		};

		const getDimensions = (): ImageCropDimensions => {
			const [borderX, borderY] = getBorders();

			return {
				canvas: {
					width: outputWidth.value + borderX * 2,
					height: outputHeight.value + borderY * 2
				},
				rotate: props.rotate,
				border: props.border,
				width: elementWidth.value,
				height: elementHeight.value
			};
		};

		const getInitialSize = (width: number, height: number) => {
			if (!width || !height) {
				return {
					width: outputWidth.value,
					height: outputHeight.value
				};
			}

			const canvasRatio = outputHeight.value / outputWidth.value;
			const imageRatio = height / width;

			if (canvasRatio > imageRatio) {
				const newHeight = outputHeight.value;
				return {
					width: width * (newHeight / height),
					height: newHeight
				};
			}

			const newWidth = outputWidth.value;
			return {
				width: newWidth,
				height: height * (newWidth / width)
			};
		};

		const getCanvasContext = (target?: HTMLCanvasElement) => target?.getContext('2d') || null;

		const paintMask = (context: CanvasRenderingContext2D) => {
			const dimensions = getDimensions();
			const [borderX, borderY] = getBorders(dimensions.border);
			const width = dimensions.canvas.width;
			const height = dimensions.canvas.height;
			let borderRadius = Math.max(props.borderRadius, 0);

			borderRadius = Math.min(
				borderRadius,
				width / 2 - borderX,
				height / 2 - borderY
			);

			context.save();
			context.scale(1, 1);
			context.translate(0, 0);
			context.fillStyle = normalizeMaskColor(props.maskColor);
			context.beginPath();
			drawRoundedRect(
				context,
				borderX,
				borderY,
				width - borderX * 2,
				height - borderY * 2,
				borderRadius
			);
			context.rect(width, 0, -width, height);
			context.fill('evenodd');
			context.restore();
		};

		const repaint = () => {
			const target = canvas.value;
			const context = getCanvasContext(target);
			/* istanbul ignore next -- public methods can call refresh before mount, but runtime render always has canvas. */
			if (!target || !context) return;

			context.clearRect(0, 0, target.width, target.height);
			paintMask(context);
			paintImage(context, { ...image.value }, props.border);
		};

		const refreshCanvasSize = () => {
			const target = canvas.value;
			/* istanbul ignore next -- guarded for calls before mount. */
			if (!target) return;

			const dimensions = getDimensions();
			target.width = dimensions.canvas.width;
			target.height = dimensions.canvas.height;
		};

		const refreshElementSize = () => {
			const target = canvas.value;
			/* istanbul ignore next -- guarded for calls before mount. */
			if (!target) return;

			const [borderX, borderY] = getBorders();
			const dimensions = getDimensions();
			const hasWidth = !!target.style.getPropertyValue('width');
			const hasHeight = !!target.style.getPropertyValue('height');

			if (hasWidth || (!hasWidth && !hasHeight)) {
				const width = target.offsetWidth || dimensions.canvas.width;
				const innerWidth = Math.max(width - borderX * 2, 0);

				elementWidth.value = width;
				elementHeight.value = (innerWidth / outputRatio.value) + borderY * 2;
				target.style.setProperty('height', `${elementHeight.value}px`);
			} else if (hasHeight) {
				const height = target.offsetHeight || dimensions.canvas.height;
				const innerHeight = Math.max(height - borderY * 2, 0);

				elementHeight.value = height;
				elementWidth.value = (innerHeight * outputRatio.value) + borderX * 2;
				target.style.setProperty('width', `${elementWidth.value}px`);
			}
		};

		const refresh = () => {
			refreshElementSize();
			refreshCanvasSize();
			repaint();
		};

		const getImageToCanvas = () => {
			const target = document.createElement('canvas');
			const context = target.getContext('2d');
			const croppingRect = getCroppingRect();
			const scale = props.scale || 1;

			target.width = outputWidth.value;
			target.height = outputHeight.value;

			if (!context || !image.value.resource) return target;

			context.translate(target.width / 2, target.height / 2);
			context.rotate((props.rotate * Math.PI) / 180);
			context.translate(-(target.width / 2), -(target.height / 2));
			context.drawImage(
				image.value.resource,
				-croppingRect.x * image.value.width * scale,
				-croppingRect.y * image.value.height * scale,
				image.value.width * scale,
				image.value.height * scale
			);

			return target;
		};

		const getImageScaledToCanvas = () => {
			const dimensions = getDimensions();
			const target = document.createElement('canvas');
			const context = target.getContext('2d');

			target.width = dimensions.width || dimensions.canvas.width;
			target.height = dimensions.height || dimensions.canvas.height;

			if (context) {
				paintImage(context, { ...image.value }, 0);
			}

			return target;
		};

		const getImage = (options: ImageCropGetImageOptions = {}) => {
			const {
				isNormal = true,
				filename = 'image',
				getFile = false
			} = options;
			const target = isNormal ? getImageToCanvas() : getImageScaledToCanvas();

			return getFile ? canvasToImage(target, filename) : canvasToImage(target);
		};

		const handleImageLoad = (loadedImage: HTMLImageElement) => {
			const imageState = {
				...getInitialSize(loadedImage.width, loadedImage.height),
				resource: loadedImage,
				x: 0.5,
				y: 0.5
			};

			dragging.value = false;
			image.value = imageState;
			emit('image-load', imageState);
		};

		const handleImageError = (event: string | Event | ProgressEvent<FileReader>) => {
			emit('image-error', event);
		};

		const loadImageURL = (source: string) => {
			/* istanbul ignore next -- SSR guard; browser behavior is covered. */
			if (IS_SERVER || !source) return;

			const imageElement = new window.Image();
			imageElement.onload = () => handleImageLoad(imageElement);
			imageElement.onerror = handleImageError;

			if (!isDataURL(source)) {
				if (props.crossOrigin) {
					imageElement.crossOrigin = props.crossOrigin;
				}
				imageElement.src = appendTimestamp(source);
			} else {
				imageElement.src = source;
			}
		};

		const loadImageFile = (file: Blob) => {
			/* istanbul ignore next -- SSR/legacy browser guard; FileReader behavior is covered. */
			if (IS_SERVER || typeof FileReader === 'undefined') return;

			const reader = new FileReader();
			reader.onload = (event) => {
				const result = event.target?.result;
				if (typeof result === 'string') {
					loadImageURL(result);
				}
			};
			reader.onerror = handleImageError;
			reader.readAsDataURL(file);
		};

		const loadImage = (source?: ImageCropSource) => {
			if (!source) return;

			if (isBlob(source)) {
				loadImageFile(source);
			} else if (typeof source === 'string') {
				loadImageURL(source);
			}
		};

		const handleStart = (event: MouseEvent | TouchEvent) => {
			if ('touches' in event && event.touches.length > 1) return;

			event.preventDefault();
			dragging.value = true;
			lastX.value = null;
			lastY.value = null;
		};

		const handleEnd = (event?: MouseEvent | TouchEvent) => {
			if (!dragging.value) return;

			dragging.value = false;
			emit('mouseup', event);
		};

		const handleMove = (event: MouseEvent | TouchEvent) => {
			if (!dragging.value) return;
			if ('touches' in event && event.touches.length > 1) return;

			const pointer = getPointer(event);

			if (lastX.value !== null && lastY.value !== null) {
				const diffX = lastX.value - pointer.x;
				const diffY = lastY.value - pointer.y;
				const scale = props.scale || 1;
				const width = image.value.width * scale;
				const height = image.value.height * scale;
				const croppingRect = getCroppingRect();
				let previousX = croppingRect.x * width;
				let previousY = croppingRect.y * height;
				let rotate = props.rotate % 360;

				if (!width || !height) {
					lastX.value = pointer.x;
					lastY.value = pointer.y;
					emit('mousemove', event);
					return;
				}

				rotate = rotate < 0 ? rotate + 360 : rotate;

				const radians = rotate * (Math.PI / 180);
				const cos = Math.cos(radians);
				const sin = Math.sin(radians);

				previousX += diffX * cos + diffY * sin;
				previousY += -diffX * sin + diffY * cos;

				const relativeWidth = (1 / scale) * getXScale();
				const relativeHeight = (1 / scale) * getYScale();
				const position = {
					x: previousX / width + relativeWidth / 2,
					y: previousY / height + relativeHeight / 2
				};

				emit('position-change', position);
				image.value = {
					...image.value,
					...position
				};
			}

			lastX.value = pointer.x;
			lastY.value = pointer.y;
			emit('mousemove', event);
		};

		const handleDragOver = (event: DragEvent) => {
			if (!props.droppable) return;

			event.preventDefault();
		};

		const handleDrop = (event: DragEvent) => {
			if (!props.droppable || !event.dataTransfer) return;

			event.stopPropagation();
			event.preventDefault();
			emit('image-drop', event);

			const { files, items } = event.dataTransfer;

			if (files?.length) {
				loadImageFile(files[0]);
			} else if (items?.length) {
				retrieveImageURL(items, src => loadImage(src));
			}
		};

		watch(
			() => props.src,
			(next, prev) => {
				if (next && next !== prev) {
					loadImage(next);
					emit('image-change', 'src');
				}
			}
		);

		watch(
			[
				() => props.scale,
				() => props.rotate,
				() => props.borderRadius,
				() => props.maskColor,
				() => props.position
			],
			() => {
				repaint();
				emit('image-change', 'props');
			},
			{ deep: true }
		);

		watch(
			[
				() => props.border,
				() => props.outputSize
			],
			() => {
				refresh();
				emit('image-change', 'size');
			},
			{ deep: true }
		);

		watch(
			() => image.value,
			() => {
				repaint();
				emit('image-change', 'image');
			}
		);

		onMounted(() => {
			/* istanbul ignore next -- SSR guard. */
			if (IS_SERVER || !canvas.value) return;

			refresh();
			loadImage(props.src);

			draggableEvents.move.forEach((eventName) => {
				document.addEventListener(eventName, handleMove as EventListener, false);
			});
			draggableEvents.end.forEach((eventName) => {
				document.addEventListener(eventName, handleEnd as EventListener, false);
			});
			Resize.on(canvas.value, refreshElementSize);
		});

		onBeforeUnmount(() => {
			/* istanbul ignore next -- SSR guard. */
			if (IS_SERVER) return;

			draggableEvents.move.forEach((eventName) => {
				document.removeEventListener(eventName, handleMove as EventListener, false);
			});
			draggableEvents.end.forEach((eventName) => {
				document.removeEventListener(eventName, handleEnd as EventListener, false);
			});
			canvas.value && Resize.off(canvas.value, refreshElementSize);
		});

		expose({
			canvas,
			refresh,
			getDimensions,
			getCroppingRect,
			getImage,
			getImageToCanvas,
			getImageScaledToCanvas
		});

		return () => {
			return (
				<canvas
					ref={canvas}
					class={COMPONENT_NAME}
					style={canvasStyle.value}
					draggable={props.droppable}
					onDragover={handleDragOver}
					onDrop={handleDrop}
					onMousedown={handleStart}
					onTouchstart={handleStart}
				/>
			);
		};
	}
});
