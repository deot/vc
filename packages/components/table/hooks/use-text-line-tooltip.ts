import type { Nullable } from '@deot/helper-shared';
import { getFitIndex } from '../../text/utils';
import { props as textProps } from '../../text/text-props';
import { useHoverPopover } from '../../popover/use-hover-popover';
import type { Popover } from '../../popover';
import { measureText } from '../../popover/utils';
import { useScrollIdle, useScrollListener, whenScrollIdle } from '../../scroller/core/scroll-idle';

// 提示的目标宽高比（宽 : 高）
const ASPECT_RATIO = 3;
// 一行至少能放下的字数（em）：短文字不换行
const MIN_LINE_EM = 20;

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
 * 	- 移动端（options.mobile）没有悬停，由调用方在点按时调用 open：再点同一处或点别处关闭，滚动时关闭；
 * 	- 同一时刻只保留一个弹层，组件卸载时销毁；
 * 	- 最大宽度按宽高比计算（见 getTooltipWidth），测量不到时只受 Popover 的屏幕上限约束；
 * 	- 弹层锚在调用方移入的节点（trigger）上，只监听它的移入 / 移出：表体为单元格、表头为 label，不会盖住鼠标所在的格子（text-line 外还有 padding）；
 * 	- 触发节点所在的滚动容器（或页面）滚动期间不弹出，停止后鼠标仍在该节点上时再弹出。
 * @param options ~
 * @param options.mobile 是否为移动端（点按触发）
 * @param options.open 创建浮层的方法，移动端传入带移动端外观的版本
 * @returns open
 */
export const useTextLineTooltip = (options: { mobile?: boolean; open?: typeof Popover.open } = {}) => {
	const { mobile = false } = options;
	const popover = useHoverPopover(options.open);

	useScrollListener();

	// 移动端：当前弹层的触发节点
	let shown: Nullable<Element> = null;
	// 点按弹层不随滚动关闭（下拉类弹层需要跟随），提示在滚动开始时关闭
	mobile && useScrollIdle({
		isRelevant: () => !!shown,
		onStart: () => popover.close()
	});

	/**
	 * 判断是否截断，截断时打开弹层
	 * @param el text-line 元素
	 * @param line 行数，为空或 0（不限行数）时不处理
	 * @param trigger 弹层的触发节点（鼠标移入的节点）
	 */
	const open = (el: Nullable<Element>, line: number | undefined, trigger: Element) => {
		// 再点同一处：这次点按已在捕获阶段把弹层关掉（弹层按外部点击处理），不再重新打开
		if (mobile && shown === trigger && !popover.isActive(trigger)) {
			shown = null;
			return;
		}
		// 点按时没有在滚动（滚动中的点按只会让滚动停下），不必等待
		(mobile ? (_: Element, fn: () => void) => fn() : whenScrollIdle)(trigger, () => {
			if (!el || !line || popover.isActive(trigger)) return;
			// clamp 未截断时内容高度不超出，跳过逐字测量
			if (el.scrollHeight <= el.clientHeight) return;

			const value = el.textContent || '';
			const endIndex = getFitIndex({
				el,
				value,
				line,
				ellipsis: textProps.ellipsis.default
			});
			if (endIndex > 0 && endIndex < value.length - 1) {
				const minWidth = el.clientWidth;
				const maxWidth = getTooltipWidth(measureText(value), minWidth);
				mobile && (shown = trigger);
				popover.open(trigger, {
					content: value,
					...(mobile && {
						hover: false,
						onDestroyed: () => shown === trigger && (shown = null)
					}),
					...(maxWidth && { portalStyle: { maxWidth: `${maxWidth}px` } })
				});
			}
		});
	};

	return { open };
};
