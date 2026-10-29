import type { ExtractPropTypes, PropType } from 'vue';
import type {
	GridResponsive,
	GridColumns,
	GridGap,
	GridJustify,
	GridAlign,
	GridJustifyContent,
	GridSpanResult
} from './types';

export const props = {
	tag: {
		type: String,
		default: 'div'
	},
	/**
	 * 数字为等宽列数；数组中数字为固定px、字符串原样使用；字符串为完整的grid-template-columns
	 */
	columns: {
		type: [Number, String, Array, Object] as PropType<GridResponsive<GridColumns>>,
		default: 24
	},
	/**
	 * [水平, 垂直]，数字表示两个方向相同
	 */
	gap: {
		type: [Number, Array, Object] as PropType<GridResponsive<GridGap>>,
		default: 0
	},
	/**
	 * 每项在自己格子内的对齐（justify-items / align-items）
	 */
	justify: String as PropType<GridJustify>,
	align: String as PropType<GridAlign>,
	/**
	 * 轨道没有占满宽度时的整体分布
	 */
	justifyContent: String as PropType<GridJustifyContent>,
	/**
	 * 只显示前collapsedRows行，suffix项始终显示在最后一行末尾
	 */
	collapsed: {
		type: Boolean,
		default: false
	},
	collapsedRows: {
		type: Number,
		default: 1
	},
	/**
	 * 同Table：返回 [rowspan, colspan] 或 { rowspan, colspan }；colspan覆盖span，任一为0时隐藏
	 */
	getSpan: Function as PropType<(data: { row: Record<string, any>; index: number }) => GridSpanResult>
};
export type Props = ExtractPropTypes<typeof props>;
