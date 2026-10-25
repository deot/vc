import { computed, getCurrentInstance, nextTick, ref } from 'vue';
import type { PropType } from 'vue';
import { getViewport, VIEWPORT_GAP } from '../../popover/use-pos';

export type ExpandDirection = 'right' | 'left' | 'auto';

/**
 * 级联列的展开方向（Cascader / TreeSelect 级联模式共用的属性）
 * 	- right 向右；left 向左（第一列贴着触发器，弹层与触发器右对齐）；auto 右侧放不下时朝空间更大的一侧
 */
export const expandDirection = {
	type: String as PropType<ExpandDirection>,
	default: 'right'
};

interface Options {
	// expandDirection
	getDirection: () => ExpandDirection;
	// 调用方要求的弹层方向
	getPlacement: () => string;
	// 第一列的节点：按它的宽度估算各列
	getColumn: () => HTMLElement | null | undefined;
	// 数据的层级；按需加载（loadData）等无法预知时为 Infinity
	getDepth: () => number;
}

/**
 * 级联列（Cascader / TreeSelect 级联模式）的展开方向
 * 	- left：第一列贴着触发器、下一级在左侧，弹层与触发器右对齐（对齐方向左右互换）；增删列都发生在远离触发器的一端，已有的列不移动
 * 	- auto：右侧放得下（第一列宽 × 层级）时向右，否则朝空间更大的一侧
 * 	- 弹层挂载时调用 update：等各列渲染后（首次绘制前）判断，一次打开期间不变
 * @param options ~
 * @returns isInverted：是否向左展开；placement、keepEdge：交给弹层；update：判断方向
 */
export const useColumnDirection = (options: Options) => {
	const { getDirection, getPlacement, getColumn, getDepth } = options;
	const instance = getCurrentInstance()!;
	const isInverted = ref(false);

	const placement = computed(() => {
		const value = getPlacement();
		return isInverted.value
			? value.replace(/^(top|bottom)-(left|right)$/, (_, main, align) => `${main}-${align === 'left' ? 'right' : 'left'}`)
			: value;
	});

	const measure = () => {
		const direction = getDirection();
		if (direction !== 'auto') {
			isInverted.value = direction === 'left';
			return;
		}
		// 左对齐时向右的可用宽度、右对齐时向左的可用宽度；左侧不比右侧宽时不必估算（层级需要遍历数据）
		const rect = (instance.vnode.el as Element).getBoundingClientRect();
		const { left, right } = getViewport(VIEWPORT_GAP);
		const after = right - rect.left;
		const before = rect.right - left;
		const width = getColumn()?.offsetWidth || 0;
		isInverted.value = !!width && before > after && width * getDepth() > after;
	};

	const update = () => nextTick(measure);

	// 向左展开时内容靠右排：弹层变窄时保持右缘（Popover 的 keepEdge）
	const keepEdge = computed(() => (isInverted.value ? 'end' : 'start'));

	return { isInverted, placement, keepEdge, update };
};
