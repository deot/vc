type TouchLike = Partial<Touch>;

/**
 * 派发鼠标事件，与真实拖动一致：默认主键，按下、移动时 buttons 含主键，其余为 0
 * @param el 派发到的目标
 * @param type 事件名
 * @param init 坐标等，可覆盖 button / buttons
 * @returns 派发的事件
 */
export const fireMouse = (el: EventTarget, type: string, init: MouseEventInit = {}) => {
	const buttons = type === 'mousedown' || type === 'mousemove' ? 1 : 0;
	const e = new MouseEvent(type, { bubbles: true, cancelable: true, buttons, ...init });
	el.dispatchEvent(e);
	return e;
};

/**
 * 派发触摸事件，与真实触摸一致：变化的触点在 changedTouches，仍按着的触点在 touches / targetTouches
 * @param el 派发到的目标；触摸事件始终派发给起点元素
 * @param type 事件名
 * @param changed 本次按下 / 移动 / 抬起 / 取消的触点，identifier 默认按序号
 * @param rest 同时仍按着的其它触点
 * @param init 事件选项，如 cancelable
 * @returns 派发的事件
 */
export const fireTouch = (
	el: EventTarget,
	type: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel',
	changed: TouchLike | TouchLike[] = {},
	rest: TouchLike[] = [],
	init: EventInit = {}
) => {
	const e = new Event(type, { bubbles: true, cancelable: true, ...init }) as any;
	const changedTouches = (Array.isArray(changed) ? changed : [changed]).map((touch, identifier) => ({ identifier, ...touch }));
	const touches = type === 'touchstart' || type === 'touchmove' ? [...changedTouches, ...rest] : rest;

	e.changedTouches = changedTouches;
	e.touches = touches;
	e.targetTouches = touches;
	el.dispatchEvent(e);
	return e as TouchEvent;
};

/**
 * 某类事件的默认行为是否被阻止（如拖动期间的 selectstart / dragstart）
 * @param type 事件名
 * @returns 是否被阻止
 */
export const blocked = (type: string) => {
	return !document.body.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
};
