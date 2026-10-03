import { onBeforeUnmount } from 'vue';

// 鼠标事件与触点都带 screenX/Y、clientX/Y、pageX/Y
export type DragPoint = MouseEvent | Touch;

type DragHandler = (e: MouseEvent | TouchEvent, point: DragPoint) => void;
// withModifiers 与事件属性都按 Event 约束参数
type DragListener = (e: Event) => void;
type DragListenerName = 'onMousedown' | 'onTouchstart' | 'onTouchmove' | 'onTouchend' | 'onTouchcancel';

export interface DragOptions {
	// 返回 false 时不进入拖动
	start?: (e: MouseEvent | TouchEvent, point: DragPoint) => boolean | void;
	move?: DragHandler;
	end?: DragHandler;
	// 手势被打断（touchcancel、mouseup 丢失）；省略时按 end 处理
	cancel?: DragHandler;
	// 为 false 时，鼠标拖动期间不选中文本、不触发原生拖拽
	selectable?: boolean;
}

/**
 * 拖动手势：鼠标与触摸共用一组回调，move / end / cancel 只出现在被接受的 start 之后
 *
 * 鼠标只认主键，按下后改在 document 上跟踪移动与松开：指针拖出元素（或视口）后，元素自身收不到 mousemove / mouseup，状态会卡住；
 * 触摸事件始终派发给起点元素，直接在元素上监听，一次手势只跟发起它的那个触点
 * @param options 回调
 * @returns 绑到元素上的监听
 */
export const useDrag = (options: DragOptions) => {
	const cancel: DragHandler = (e, point) => (options.cancel || options.end)?.(e, point);
	const preventDefault = (e: Event) => e.preventDefault();

	// 鼠标拖动期间的 document 监听
	const toggleMouseListeners = (add: boolean) => {
		const fn = (add ? document.addEventListener : document.removeEventListener).bind(document);
		fn('mousemove', handleMouseMove as EventListener);
		fn('mouseup', handleMouseUp as EventListener);
		if (options.selectable === false) {
			fn('selectstart', preventDefault);
			fn('dragstart', preventDefault);
		}
	};

	const handleMouseMove = (e: MouseEvent) => {
		// 主键已松开但没收到 mouseup（右键菜单、原生拖拽等会吞掉它）：按打断处理
		if (!(e.buttons & 1)) {
			toggleMouseListeners(false);
			cancel(e, e);
			return;
		}
		options.move?.(e, e);
	};

	const handleMouseUp = (e: MouseEvent) => {
		if (e.button !== 0) return;
		toggleMouseListeners(false);
		options.end?.(e, e);
	};

	const handleMouseDown = (e: MouseEvent) => {
		if (e.button !== 0 || options.start?.(e, e) === false) return;
		toggleMouseListeners(true);
	};

	// 当前手势的触点
	let touchId: number | null = null;

	const findTouch = (touches?: TouchList) => {
		for (let i = 0; touchId !== null && i < (touches?.length || 0); i++) {
			if (touches![i].identifier === touchId) return touches![i];
		}
	};

	const handleTouchStart = (e: TouchEvent) => {
		// 手势中再按下的其它手指不参与；原触点没收到结束就再次出现在按下里时，重新开始
		if (findTouch(e.touches) && !findTouch(e.changedTouches)) return;

		const point = e.changedTouches?.[0] || e.touches?.[0];
		touchId = point && options.start?.(e, point) !== false ? point.identifier : null;
	};

	const handleTouchMove = (e: TouchEvent) => {
		const point = findTouch(e.touches);
		point && options.move?.(e, point);
	};

	const createTouchEnd = (handler: DragHandler) => (e: TouchEvent) => {
		const point = findTouch(e.changedTouches);
		if (!point) return;

		touchId = null;
		handler(e, point);
	};

	onBeforeUnmount(() => toggleMouseListeners(false));

	return {
		listeners: {
			onMousedown: handleMouseDown,
			onTouchstart: handleTouchStart,
			onTouchmove: handleTouchMove,
			onTouchend: createTouchEnd((e, point) => options.end?.(e, point)),
			onTouchcancel: createTouchEnd(cancel)
		} as Record<DragListenerName, DragListener>
	};
};
