import { onMounted, onBeforeUnmount } from 'vue';
import type { Nullable } from '@deot/helper-shared';
import { getFitIndex } from '../../text/utils';
import { useHoverPopover } from '../../popover/use-hover-popover';
import { measureText } from '../../popover/utils';

// 提示的目标宽高比（宽 : 高）
const ASPECT_RATIO = 3;
// 一行至少能放下的字数（em）：短文字不换行
const MIN_LINE_EM = 20;
// 滚动停止多久后才弹出（ms）
const SCROLL_IDLE = 150;

// 最近一次滚动：所有实例共用一个捕获阶段的监听，按引用计数注册 / 注销
// 滚动的元素用 WeakRef 保存：否则已卸载的 Table（滚动过的表体）会一直留在内存里
const lastScroll = { time: 0, target: null as Nullable<WeakRef<EventTarget>> };
let listeners = 0;
// 滚动停止后待弹出的提示（同一时刻只有一个；实例卸载后单元格已脱离文档，不会再处于 :hover，无需清除）
let pending: ReturnType<typeof setTimeout> | undefined;
const markScroll = (e: Event) => {
	lastScroll.time = Date.now();
	lastScroll.target = e.target && new WeakRef(e.target);
};
const listenScroll = () => {
	listeners++ || document.addEventListener('scroll', markScroll, { capture: true, passive: true });
};
const unlistenScroll = () => {
	--listeners || document.removeEventListener('scroll', markScroll, { capture: true });
};

// 触发节点所在的滚动容器（或页面）是否刚滚动过：内容在静止的鼠标下移动也会触发移入
const getScrollWait = (trigger: Element) => {
	const target = lastScroll.target?.deref();
	const related = target === document || (target instanceof Node && target.contains(trigger));
	return related ? SCROLL_IDLE - (Date.now() - lastScroll.time) : 0;
};

/**
 * 提示的最大宽度：长文字接近 ASPECT_RATIO 的宽高比，短文字不换行
 * 	- 宽度为 w 时约 width / w 行，高 ≈ width / w × lineHeight；由 w : 高 = ASPECT_RATIO 得 w = √(ASPECT_RATIO × width × lineHeight)
 * 	- 不窄于 MIN_LINE_EM 个字与单元格文字（minWidth），不宽于一行的宽度；再往上由 Popover 限制在屏幕内
 * @param size 文字排成一行时的尺寸，见 popover/utils 的 measureText
 * @param size.width 一行的宽度（不含 padding）
 * @param size.fontSize 字号
 * @param size.lineHeight 行高
 * @param size.padding 内容区左右 padding
 * @param minWidth 最小宽度（单元格文字的宽度）
 * @returns 最大宽度（含内容区 padding）；测量不到时为 0
 */
export const getTooltipWidth = (size: { width: number; fontSize: number; lineHeight: number; padding: number }, minWidth: number) => {
	const { width, fontSize, lineHeight, padding } = size;
	if (width <= 0 || lineHeight <= 0) return 0;
	const balanced = Math.sqrt(ASPECT_RATIO * width * lineHeight);
	return Math.ceil(Math.min(width, Math.max(balanced, fontSize * MIN_LINE_EM, minWidth)) + padding);
};

/**
 * 多行省略（.vc-table__text-line）被截断时，hover 展示完整内容；表体 cell 与表头 label 共用
 * 	- 同一时刻只保留一个弹层，组件卸载时销毁；
 * 	- 最大宽度按宽高比计算（见 getTooltipWidth），测量不到时只受 Popover 的屏幕上限约束；
 * 	- 弹层锚在调用方移入的节点（trigger）上，只监听它的移入 / 移出：表体为单元格、表头为 label，不会盖住鼠标所在的格子（text-line 外还有 padding）；
 * 	- 触发节点所在的滚动容器（或页面）滚动期间不弹出，停止后鼠标仍在该节点上时再弹出。
 * @returns open
 */
export const useTextLineTooltip = () => {
	const popover = useHoverPopover();

	onMounted(listenScroll);
	onBeforeUnmount(unlistenScroll);

	/**
	 * 判断是否截断，截断时打开弹层
	 * @param el text-line 元素
	 * @param line 行数，为空或 0（不限行数）时不处理
	 * @param trigger 弹层的触发节点（鼠标移入的节点）
	 */
	const open = (el: Nullable<Element>, line: number | undefined, trigger: Element) => {
		clearTimeout(pending);
		if (!el || !line || popover.isActive(trigger)) return;

		const wait = getScrollWait(trigger);
		if (wait > 0) {
			pending = setTimeout(() => trigger.matches(':hover') && open(el, line, trigger), wait);
			return;
		}
		// clamp 未截断时内容高度不超出，跳过逐字测量
		if (el.scrollHeight <= el.clientHeight) return;

		const value = el.textContent || '';
		const endIndex = getFitIndex({
			el,
			value,
			line,
			ellipsis: '...'
		});
		if (endIndex > 0 && endIndex < value.length - 1) {
			const minWidth = el.clientWidth;
			const maxWidth = getTooltipWidth(measureText(value), minWidth);
			popover.open(trigger, {
				content: value,
				...(maxWidth && { portalStyle: { maxWidth: `${maxWidth}px` } })
			});
		}
	};

	return { open };
};
