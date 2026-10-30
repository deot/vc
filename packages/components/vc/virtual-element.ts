import { markRaw } from 'vue';
import { IS_SERVER } from '@deot/vc-shared';

/**
 * 视口里的一个盒子，与 getBoundingClientRect 的结果同名的四个字段
 */
export type RectLike = {
	left: number;
	top: number;
	width: number;
	height: number;
};

type Click = {
	box: WeakRef<Element>;
	// 点下的那个点（宽高为 0 的盒子）；键盘、el.click() 的点击没有
	point: RectLike | null;
};

// 点在按钮、链接里的文字或图标上时，取整个按钮、链接
const CLICKABLE = 'button, a, [role="button"]';

/**
 * 点中的按钮、链接，或元素本身；文本节点取所在元素，页面空白处为 null
 * @param target 事件的目标
 * @returns 要取位置的元素
 */
const boxOf = (target: EventTarget | null) => {
	const el = target instanceof Element ? target : target instanceof Node ? target.parentElement : null;
	const box = el?.closest(CLICKABLE) || el;
	return box === document.body || box === document.documentElement ? null : box;
};

/**
 * 点下的那个点；键盘、el.click() 触发的点击（detail 为 0）没有坐标
 * @param e 鼠标事件
 * @returns 宽高为 0 的盒子
 */
const pointOf = (e: MouseEvent): RectLike | null => (e.detail ? { left: e.clientX, top: e.clientY, width: 0, height: 0 } : null);

/**
 * 元素或替身此刻的盒子。元素不在文档里、没有尺寸（被隐藏）时为 null；替身的盒子原样使用，宽高为 0 时就是一个点（如光标）
 * @param el 元素或替身
 * @returns 盒子
 */
export const toRect = (el?: Element | VirtualElement | null): RectLike | null => {
	if (!el) return null;
	const isElement = el instanceof Element;
	if (isElement && !el.isConnected) return null;
	const { left, top, width, height } = el.getBoundingClientRect();
	return !isElement || (width > 0 && height > 0) ? { left, top, width, height } : null;
};

// 最近一次点击：点中的按钮、链接（弱引用）和点下的那个点。点击时不读布局，用到时再量
let click: Click | null = null;

IS_SERVER || document.addEventListener('click', (e: MouseEvent) => {
	const box = boxOf(e.target);
	click = box && { box: new WeakRef(box), point: pointOf(e) };
}, true);

/**
 * 元素的替身：只有一个固定的盒子，可以代替元素给出位置，如点击的位置、选中文字的位置、图表上的一个点。
 * 弹层不传触发元素时，由 fromClick 把最近一次点击量成替身
 */
export class VirtualElement {
	/**
	 * 最近一次点击的位置，调用时才量，之后与点击记录无关：
	 * - 按钮还在且有尺寸：它此刻的盒子
	 * - 已被移除、隐藏（如请求回来时下拉菜单已收起）：点下的那个点
	 * - 都没有（还没有点击、点在页面空白处、键盘点击后按钮已移除）：null
	 * @returns 替身，contextElement 为点中的按钮（可能已不在文档里）
	 */
	static fromClick() {
		return click && VirtualElement.of(click.box.deref(), click.point);
	}

	/**
	 * 由一个鼠标事件量出替身（如右键菜单、自己的点击处理里、await 之前），调用时就量：
	 * 点中的按钮、链接还在且有尺寸时取它此刻的盒子，否则取点下的那个点；都没有时为 null
	 * @param e 鼠标事件
	 * @returns 替身，contextElement 为点中的按钮
	 */
	static fromEvent(e: MouseEvent) {
		return VirtualElement.of(boxOf(e.target), pointOf(e));
	}

	/**
	 * 按钮此刻的盒子，量不到时退到点下的那个点
	 * @param box 点中的按钮、链接
	 * @param point 点下的那个点
	 * @returns 替身；都没有时为 null
	 */
	private static of(box: Element | null | undefined, point: RectLike | null) {
		const rect = toRect(box) || point;
		return rect ? new VirtualElement(rect, box) : null;
	}

	private rect: Readonly<RectLike>;

	private ref: WeakRef<Element> | null;

	/**
	 * @param rect 盒子，按创建时的值保存
	 * @param element 对应的元素（可选，弱引用），只用来补充位置以外的信息，如垫底的缩略图
	 */
	constructor(rect: RectLike, element?: Element | null) {
		this.rect = Object.freeze({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
		this.ref = element ? new WeakRef(element) : null;
		// 放进 ref、reactive 时不做深层代理
		markRaw(this);
	}

	getBoundingClientRect() {
		return this.rect;
	}

	/**
	 * 对应的元素，可能已不在文档里或已被回收
	 * @returns 元素
	 */
	get contextElement() {
		return this.ref?.deref();
	}
}
