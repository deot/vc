import { provide, h, cloneVNode, ref, computed } from 'vue';
import type { VNode, SetupContext } from 'vue';
import { toPx, toRem } from '@deot/vc-shared';
import { getChildren } from '../fragment/utils';
import { props as gridProps } from './grid-props';
import type { Props } from './grid-props';
import { GridItem } from './grid-item';
import { props as gridItemProps } from './grid-item-props';
import { useResponsive } from './hooks/use-responsive';
import { layout, resolveTracks, resolveGap, resolveSpan, getCellStyle } from './utils';

// GridItem不会自己解析props，默认值取自它的声明
const SPAN = gridItemProps.span.default;
const OFFSET = gridItemProps.offset.default;

/**
 * Grid / MGrid 共用
 * @param props ~
 * @param context ~
 * @param options ~
 * @param options.mobile 移动端：根节点加vcm-grid，gap与columns数组中的数字按750稿
 * @returns render
 */
export const useGrid = (props: Props, context: SetupContext, options: { mobile?: boolean } = {}) => {
	const { slots } = context;
	const current = ref<HTMLElement>();
	// 折叠时是否有项被隐藏，GridItem的插槽使用
	const overflow = ref(false);
	const responsive = useResponsive(current);
	const toLength = options.mobile ? toRem : toPx;

	provide('vc-grid', { overflow });

	const tracks = computed(() => resolveTracks(responsive.resolve(props.columns, gridProps.columns.default), toLength));

	const classes = computed(() => {
		return [
			options.mobile ? 'vc-grid vcm-grid' : 'vc-grid',
			{
				[`is-justify-${props.justify}`]: !!props.justify,
				[`is-align-${props.align}`]: !!props.align,
				[`is-justify-content-${props.justifyContent}`]: !!props.justifyContent
			}
		];
	});

	const style = computed(() => {
		return {
			gridTemplateColumns: tracks.value.template,
			gap: resolveGap(responsive.resolve(props.gap, 0), toLength)
		};
	});

	/**
	 * 按各项的props（及getSpan）计算位置，写到各项的style上
	 * @param vnodes GridItem
	 * @returns ~
	 */
	const renderItems = (vnodes: VNode[]) => {
		const result = layout({
			columns: tracks.value.count,
			collapsed: props.collapsed,
			collapsedRows: props.collapsedRows,
			items: vnodes.map((vnode, index) => {
				const row: Record<string, any> = { span: SPAN, offset: OFFSET, ...vnode.props };
				// <GridItem suffix> 的值为空字符串
				row.suffix = row.suffix === '' || !!row.suffix;
				const { rowspan, colspan, hidden } = resolveSpan(props.getSpan?.({ row, index }));
				return {
					span: colspan ?? responsive.resolve(row.span, SPAN),
					offset: responsive.resolve(row.offset, OFFSET),
					suffix: row.suffix,
					rowspan,
					hidden
				};
			})
		});
		overflow.value = result.overflow;
		return vnodes.map((vnode, index) => {
			const cell = result.cells[index];
			// 隐藏的项保留实例（折叠展开后状态不丢）；style按内容比较，位置不变时GridItem不更新
			return cloneVNode(vnode, { style: cell.hidden ? { display: 'none' } : getCellStyle(cell) });
		});
	};

	return () => {
		return h(
			props.tag,
			{ ref: current, class: classes.value, style: style.value },
			renderItems(getChildren(slots.default?.(), [GridItem]))
		);
	};
};
