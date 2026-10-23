import { onBeforeUnmount } from 'vue';

export interface GesturePoint {
	x: number;
	y: number;
}

export interface GestureTapEvent extends GesturePoint {
	pointerType: string;
	// 按下时的元素：指针被捕获后 pointerup 的 target 会变成捕获元素
	target: EventTarget | null;
	event: PointerEvent;
}

export interface GestureMoveStartEvent {
	// 越过阈值时位移较大的轴
	axis: 'x' | 'y';
	offsetX: number;
	offsetY: number;
	pointerType: string;
	event: PointerEvent;
}

export interface GestureMoveEvent extends GesturePoint {
	// 相邻两次移动的增量；累加等于 offset
	deltaX: number;
	deltaY: number;
	// 相对按下点的总位移
	offsetX: number;
	offsetY: number;
	pointerType: string;
	event: PointerEvent;
}

export interface GestureMoveEndEvent {
	offsetX: number;
	offsetY: number;
	// 松开前的速度，单位 px/ms；停顿后松开时为 0
	velocityX: number;
	velocityY: number;
	// pointercancel、第二根手指按下（转为捏合）时为 true
	canceled: boolean;
	pointerType: string;
	event: PointerEvent;
}

export interface GestureSwipeEvent extends Omit<GestureMoveEndEvent, 'canceled'> {
	direction: 'left' | 'right' | 'up' | 'down';
}

export interface GesturePinchEvent {
	// 当前双指距离 / 起始双指距离
	scale: number;
	center: GesturePoint;
	event: PointerEvent;
}

export interface GestureRotateEvent {
	// 相对上一次双指向量的角度差，顺时针为正
	angle: number;
	event: PointerEvent;
}

export interface GestureWheelEvent extends GesturePoint {
	// 按 deltaMode 换算后的像素
	deltaX: number;
	deltaY: number;
	event: WheelEvent;
}

export interface GestureOptions {
	// 越过该距离（px）才算移动；未越过时视为点按
	threshold?: number;
	// swipe 的速度阈值（px/ms）
	flickThreshold?: number;
	// 从匹配的元素按下时不识别
	ignore?: string;
	// 为 false 时滚轮不阻止默认行为
	prevent?: boolean;
	tap?: (e: GestureTapEvent) => void;
	// 传入后，触摸和笔的 tap 延迟确认，双击时只触发 doubleTap；鼠标单击立即触发
	doubleTap?: (e: GestureTapEvent) => void;
	// 返回 true 时这次触摸不等双击窗口，例如点蒙层立即关闭
	immediateTap?: (e: GestureTapEvent) => boolean;
	longTap?: (e: GestureTapEvent) => void;
	moveStart?: (e: GestureMoveStartEvent) => void;
	move?: (e: GestureMoveEvent) => void;
	moveEnd?: (e: GestureMoveEndEvent) => void;
	swipe?: (e: GestureSwipeEvent) => void;
	pinchStart?: (e: GesturePinchEvent) => void;
	pinch?: (e: GesturePinchEvent) => void;
	pinchEnd?: (e: GesturePinchEvent) => void;
	rotate?: (e: GestureRotateEvent) => void;
	// 传入后才监听滚轮
	wheel?: (e: GestureWheelEvent) => void;
}

type Session = {
	pointerType: string;
	target: EventTarget | null;
	start: GesturePoint;
	last: GesturePoint;
	lastTime: number;
	velocity: GesturePoint;
	isMoving: boolean;
	isLongTapped: boolean;
	// 按下第二根手指后到全部松开前，只识别捏合
	pinch: null | { distance: number; vector: GesturePoint; scale: number; center: GesturePoint; isEnded: boolean };
};

const DOUBLE_TAP_DELAY = 300;
const DOUBLE_TAP_DISTANCE = 30;
const LONG_TAP_DELAY = 800;
// 松开前停顿超过该时长（ms）时速度按 0 计
const VELOCITY_IDLE = 100;

const getAngle = (from: GesturePoint, to: GesturePoint) => {
	const cross = from.x * to.y - from.y * to.x;
	const dot = from.x * to.x + from.y * to.y;
	return Math.atan2(cross, dot) * 180 / Math.PI;
};

/**
 * 指针手势：鼠标、触摸、笔共用一套识别，坐标相对绑定元素。
 * 按下后捕获指针，移动、松开都派发给绑定元素；绑定元素需要自行设置 touch-action，避免浏览器接管滚动与缩放
 * @param options 阈值与回调；回调在触发时读取，可以是 getter
 * @returns 绑到元素上的监听与取消当前手势的方法
 */
export const useGesture = (options: GestureOptions) => {
	const pointers = new Map<number, GesturePoint>();
	let session: Session | null = null;
	let origin: GesturePoint = { x: 0, y: 0 };
	let longTimer: ReturnType<typeof setTimeout> | undefined;
	let tapTimer: ReturnType<typeof setTimeout> | undefined;
	let lastTap: (GesturePoint & { time: number }) | null = null;

	const toLocal = (e: MouseEvent): GesturePoint => ({ x: e.clientX - origin.x, y: e.clientY - origin.y });

	const getPair = () => {
		const [a, b] = [...pointers.values()];
		return {
			vector: { x: b.x - a.x, y: b.y - a.y },
			center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
		};
	};

	const toTap = (current: Session, e: PointerEvent): GestureTapEvent => ({
		...current.start,
		pointerType: current.pointerType,
		target: current.target,
		event: e
	});

	const clearLongTap = () => {
		clearTimeout(longTimer);
		longTimer = undefined;
	};

	const cancel = () => {
		clearLongTap();
		clearTimeout(tapTimer);
		pointers.clear();
		session = null;
		lastTap = null;
	};

	const handleTap = (e: GestureTapEvent) => {
		// 鼠标单击、以及调用方标明的点按（如点蒙层）不等双击窗口
		if (!options.doubleTap || e.pointerType === 'mouse' || options.immediateTap?.(e)) {
			clearTimeout(tapTimer);
			lastTap = null;
			options.tap?.(e);
			return;
		}
		const now = Date.now();
		if (lastTap && now - lastTap.time < DOUBLE_TAP_DELAY && Math.hypot(e.x - lastTap.x, e.y - lastTap.y) < DOUBLE_TAP_DISTANCE) {
			clearTimeout(tapTimer);
			lastTap = null;
			options.doubleTap(e);
			return;
		}
		lastTap = { x: e.x, y: e.y, time: now };
		tapTimer = setTimeout(() => {
			lastTap = null;
			options.tap?.(e);
		}, DOUBLE_TAP_DELAY);
	};

	const endMove = (current: Session, e: PointerEvent, canceled: boolean) => {
		const idle = Date.now() - current.lastTime > VELOCITY_IDLE;
		const payload = {
			offsetX: current.last.x - current.start.x,
			offsetY: current.last.y - current.start.y,
			velocityX: idle ? 0 : current.velocity.x,
			velocityY: idle ? 0 : current.velocity.y,
			pointerType: current.pointerType,
			event: e
		};
		options.moveEnd?.({ ...payload, canceled });
		if (canceled || !options.swipe) return;
		const { velocityX, velocityY, offsetX, offsetY } = payload;
		const threshold = options.threshold ?? 8;
		if (Math.hypot(velocityX, velocityY) <= (options.flickThreshold ?? 0.6)) return;
		if (Math.max(Math.abs(offsetX), Math.abs(offsetY)) <= threshold) return;
		const direction = Math.abs(offsetX) > Math.abs(offsetY)
			? (offsetX < 0 ? 'left' : 'right')
			: (offsetY < 0 ? 'up' : 'down');
		options.swipe({ ...payload, direction });
	};

	const startPinch = (current: Session, e: PointerEvent) => {
		clearLongTap();
		current.isMoving && endMove(current, e, true);
		current.isMoving = false;
		const { vector, center } = getPair();
		current.pinch = { distance: Math.max(1, Math.hypot(vector.x, vector.y)), vector, scale: 1, center, isEnded: false };
		options.pinchStart?.({ scale: 1, center, event: e });
	};

	const endPinch = (current: Session, e: PointerEvent) => {
		const pinch = current.pinch!;
		if (pinch.isEnded) return;
		pinch.isEnded = true;
		options.pinchEnd?.({ scale: pinch.scale, center: pinch.center, event: e });
	};

	const handlePointerDown = (e: PointerEvent) => {
		if (e.button !== 0 || pointers.size >= 2) return;
		const target = e.target;
		if (options.ignore && target instanceof Element && target.closest(options.ignore)) return;
		const el = e.currentTarget as HTMLElement;
		if (!session) {
			const rect = el.getBoundingClientRect();
			origin = { x: rect.left, y: rect.top };
		}
		el.setPointerCapture?.(e.pointerId);
		const point = toLocal(e);
		pointers.set(e.pointerId, point);

		if (session) {
			// 第二根手指按下，或捏合中途抬起一根后重新按下
			(!session.pinch || session.pinch.isEnded) && startPinch(session, e);
			return;
		}
		const current: Session = {
			pointerType: e.pointerType,
			target,
			start: point,
			last: point,
			lastTime: Date.now(),
			velocity: { x: 0, y: 0 },
			isMoving: false,
			isLongTapped: false,
			pinch: null
		};
		session = current;
		if (options.longTap) {
			longTimer = setTimeout(() => {
				current.isLongTapped = true;
				options.longTap?.(toTap(current, e));
			}, LONG_TAP_DELAY);
		}
	};

	const handlePointerMove = (e: PointerEvent) => {
		const current = session;
		if (!current || !pointers.has(e.pointerId)) return;
		const point = toLocal(e);
		pointers.set(e.pointerId, point);

		const pinch = current.pinch;
		if (pinch) {
			if (pinch.isEnded || pointers.size < 2) return;
			const { vector, center } = getPair();
			pinch.scale = Math.hypot(vector.x, vector.y) / pinch.distance;
			pinch.center = center;
			options.pinch?.({ scale: pinch.scale, center, event: e });
			options.rotate?.({ angle: getAngle(pinch.vector, vector), event: e });
			pinch.vector = vector;
			return;
		}

		const offsetX = point.x - current.start.x;
		const offsetY = point.y - current.start.y;
		if (!current.isMoving) {
			if (Math.hypot(offsetX, offsetY) < (options.threshold ?? 8)) return;
			current.isMoving = true;
			clearLongTap();
			options.moveStart?.({
				axis: Math.abs(offsetX) >= Math.abs(offsetY) ? 'x' : 'y',
				offsetX,
				offsetY,
				pointerType: current.pointerType,
				event: e
			});
		}

		const now = Date.now();
		const duration = Math.max(1, now - current.lastTime);
		const deltaX = point.x - current.last.x;
		const deltaY = point.y - current.last.y;
		// 平滑相邻两次的瞬时速度，避免单次抖动
		current.velocity = {
			x: current.velocity.x * 0.2 + (deltaX / duration) * 0.8,
			y: current.velocity.y * 0.2 + (deltaY / duration) * 0.8
		};
		current.last = point;
		current.lastTime = now;
		options.move?.({ ...point, deltaX, deltaY, offsetX, offsetY, pointerType: current.pointerType, event: e });
	};

	const handlePointerUp = (e: PointerEvent) => {
		const current = session;
		if (!current || !pointers.has(e.pointerId)) return;
		pointers.delete(e.pointerId);
		const canceled = e.type === 'pointercancel';

		if (current.pinch) {
			endPinch(current, e);
			pointers.size || (session = null);
			return;
		}

		session = null;
		clearLongTap();
		if (current.isMoving) {
			endMove(current, e, canceled);
		} else if (!canceled && !current.isLongTapped) {
			handleTap(toTap(current, e));
		}
	};

	const handleWheel = (e: WheelEvent) => {
		const el = e.currentTarget as HTMLElement;
		const rect = el.getBoundingClientRect();
		const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? (el.clientHeight || window.innerHeight) : 1;
		options.prevent !== false && e.preventDefault();
		options.wheel?.({
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
			deltaX: e.deltaX * unit,
			deltaY: e.deltaY * unit,
			event: e
		});
	};

	onBeforeUnmount(cancel);

	// 元素上的 wheel 监听默认不是 passive，可以阻止页面滚动；没有回调时不绑定，不影响滚动性能
	return {
		listeners: {
			onPointerdown: handlePointerDown,
			onPointermove: handlePointerMove,
			onPointerup: handlePointerUp,
			onPointercancel: handlePointerUp,
			...(options.wheel ? { onWheel: handleWheel } : {})
		},
		cancel
	};
};
