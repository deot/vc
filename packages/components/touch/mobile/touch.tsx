/** @jsxImportSource vue */

import { defineComponent, h } from 'vue';
import { props as touchProps } from './touch-props';

const COMPONENT_NAME = 'vcm-touch';
const MAX_TAP_ABS_X = 60;
const MAX_TAP_ABS_Y = 60;
const LONG_TAP_DELAY = 800;
const DOUBLE_TAP_DELAY = 300;
const TAP_DELAY = 500;

interface TouchPoint {
	pageX: number;
	pageY: number;
}

interface Vector {
	x: number;
	y: number;
}

const getTime = () => Date.now();

const getDistance = (xLen: number, yLen: number) => {
	return Math.sqrt(xLen * xLen + yLen * yLen);
};

const getRotateDirection = (vector1: Vector, vector2: Vector) => {
	return vector1.x * vector2.y - vector2.x * vector1.y;
};

const getRotateAngle = (vector1: Vector, vector2: Vector) => {
	let direction = getRotateDirection(vector1, vector2);
	direction = direction > 0 ? -1 : 1;

	const len1 = getDistance(vector1.x, vector1.y);
	const len2 = getDistance(vector2.x, vector2.y);
	const mr = len1 * len2;
	if (mr === 0) return 0;

	const dot = vector1.x * vector2.x + vector1.y * vector2.y;
	let r = dot / mr;
	if (r > 1) r = 1;
	if (r < -1) r = -1;

	return (Math.acos(r) * direction * 180) / Math.PI;
};

export const Touch = defineComponent({
	name: COMPONENT_NAME,
	props: touchProps,
	emits: [
		'tap',
		'long-tap',
		'double-tap',
		'pinch',
		'rotate',
		'move',
		'swipe',
		'swipe-left',
		'swipe-right',
		'swipe-up',
		'swipe-down'
	],
	setup(props, { emit, slots }) {
		let startX: number | null = null;
		let startY: number | null = null;
		let startTime = 0;
		let moveX: number | null = null;
		let moveY: number | null = null;
		let previousPinchScale = 1;
		let previousTouchPoint: { startX: number; startY: number } | null = null;
		let previousTouchDistance = 0;
		let previousTouchTime = 0;
		let longTapTimeout: ReturnType<typeof setTimeout> | null = null;
		let touchVector: Vector | null = null;

		const clearLongTap = () => {
			if (!longTapTimeout) return;
			clearTimeout(longTapTimeout);
			longTapTimeout = null;
		};

		const reset = () => {
			startX = null;
			startY = null;
			moveX = null;
			moveY = null;
			previousPinchScale = 1;
			previousTouchDistance = 0;
			touchVector = null;
		};

		const handleStart = (e: TouchEvent) => {
			const point = e.touches[0] as TouchPoint | undefined;
			if (!point) return;

			startX = point.pageX;
			startY = point.pageY;
			moveX = null;
			moveY = null;
			startTime = getTime();
			clearLongTap();

			if (e.touches.length > 1) {
				const point2 = e.touches[1] as TouchPoint;
				const xLen = Math.abs(point2.pageX - startX);
				const yLen = Math.abs(point2.pageY - startY);
				previousTouchDistance = getDistance(xLen, yLen);
				touchVector = {
					x: point2.pageX - startX,
					y: point2.pageY - startY
				};
				return;
			}

			longTapTimeout = setTimeout(() => {
				emit('long-tap', e);
			}, LONG_TAP_DELAY);

			if (
				previousTouchPoint
				&& Math.abs(startX - previousTouchPoint.startX) < MAX_TAP_ABS_X
				&& Math.abs(startY - previousTouchPoint.startY) < MAX_TAP_ABS_Y
				&& Math.abs(startTime - previousTouchTime) < DOUBLE_TAP_DELAY
			) {
				emit('double-tap', e);
			}

			previousTouchTime = startTime;
			previousTouchPoint = {
				startX,
				startY
			};
		};

		const handleMove = (e: TouchEvent) => {
			if (props.prevent) {
				e.preventDefault();
			}

			if (e.touches.length > 1) {
				const point1 = e.touches[0] as TouchPoint;
				const point2 = e.touches[1] as TouchPoint;
				const xLen = Math.abs(point1.pageX - point2.pageX);
				const yLen = Math.abs(point1.pageY - point2.pageY);
				const touchDistance = getDistance(xLen, yLen);

				if (previousTouchDistance && touchDistance > 0) {
					let pinchScale: number;
					if (touchDistance > previousTouchDistance) {
						pinchScale = touchDistance / previousTouchDistance;
						emit('pinch', {
							scale: pinchScale - previousPinchScale
						});
					} else {
						pinchScale = previousTouchDistance / touchDistance;
						emit('pinch', {
							scale: previousPinchScale - pinchScale
						});
					}
					previousPinchScale = pinchScale;
				}

				if (touchVector) {
					const vector = {
						x: point2.pageX - point1.pageX,
						y: point2.pageY - point1.pageY
					};
					const angle = getRotateAngle(vector, touchVector);
					emit('rotate', { angle });
					touchVector = vector;
				}
				return;
			}

			clearLongTap();

			const point = e.touches[0] as TouchPoint | undefined;
			if (!point) return;

			const deltaX = moveX === null ? 0 : point.pageX - moveX;
			const deltaY = moveY === null ? 0 : point.pageY - moveY;

			emit('move', {
				deltaX,
				deltaY
			});
			moveX = point.pageX;
			moveY = point.pageY;
		};

		const handleEnd = (e: TouchEvent) => {
			clearLongTap();

			if (startX === null || startY === null) {
				reset();
				return;
			}

			const endX = moveX === null ? startX : moveX;
			const endY = moveY === null ? startY : moveY;
			const absX = Math.abs(endX - startX);
			const absY = Math.abs(endY - startY);
			const deltaX = endX - startX;
			const deltaY = endY - startY;
			const time = Math.max(getTime() - startTime, 1);
			const velocity = getDistance(absX, absY) / time;
			const isFlick = velocity > props.flickThreshold;
			const isMultiTouchEnd = e.changedTouches.length > 1;
			const isSwipe = (
				(absX > MAX_TAP_ABS_X || absY > MAX_TAP_ABS_Y)
				&& !isMultiTouchEnd
				&& isFlick
			);

			if (isSwipe) {
				emit('swipe', { deltaX, deltaY, isFlick });
				if (absX > absY) {
					emit(deltaX < 0 ? 'swipe-left' : 'swipe-right', { deltaX, isFlick });
				} else {
					emit(deltaY < 0 ? 'swipe-up' : 'swipe-down', { deltaY, isFlick });
				}
			} else if (time < 2000 && time < TAP_DELAY) {
				emit('tap', e);
			}

			reset();
		};

		const handleCancel = () => {
			clearLongTap();
			reset();
		};

		return () => h(
			props.tag,
			{
				class: ['vc-touch', 'vcm-touch'],
				onTouchstart: handleStart,
				onTouchmove: handleMove,
				onTouchend: handleEnd,
				onTouchcancel: handleCancel
			},
			slots.default?.()
		);
	}
});
