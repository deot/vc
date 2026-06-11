/** @jsxImportSource vue */

import { defineComponent, computed } from 'vue';
import { parseHeight } from '../utils';

/**
 * 单元格描述（由调用方预处理好，getSpan 等业务求值在外部完成）。
 * 组件内部只认坐标 + span，不感知 row/column 业务对象；
 * 被覆盖（skip）的格子不传入即可，组件不渲染它们。
 */
export interface TableMergeCell {
	/** 唯一 key，缺省用 `${rowIndex}:${columnIndex}` */
	key?: string | number;
	/** 绝对行号（配合 rowStart 映射为 grid 行号） */
	rowIndex: number;
	/** 列号（叶子列坐标） */
	columnIndex: number;
	/** 跨行数，默认 1 */
	rowspan?: number;
	/** 跨列数，默认 1 */
	colspan?: number;
	/** 额外 class（sticky class、业务 class 等由调用方合并好传入） */
	class?: any;
	/** 额外 style（sticky style、业务 style 等由调用方合并好传入） */
	style?: any;
	/** 透传到 cell 根节点的 attrs / 事件（onClick、data-row 等） */
	attrs?: Record<string, any>;
	/** cell 内容渲染插槽 */
	render?: (cell: TableMergeCell) => any;
}

const COMPONENT_NAME = 'vc-table-merge-layer';

/**
 * 基于 CSS Grid 的公共合并渲染层，header（多级表头）与 body（getSpan 合并块）共用。
 * - columns 仅用于生成 grid-template-columns（取 column.realWidth，最后一列 minmax 兜底）；
 * - cell 定位使用 grid-row/column-start + span，anchor cell 上输出 aria-rowspan/aria-colspan；
 * - rowStart 为虚拟化扩展点：cells 的 rowIndex 为绝对行号，按 rowStart 平移映射 grid 行号，
 *   未来若 RecycleList 支持跨窗口 anchor，可直接以窗口起始行号作为 rowStart 渲染窗口内 cells。
 */
export const TableMergeLayer = defineComponent({
	name: COMPONENT_NAME,
	props: {
		// 列对象数组，仅消费 realWidth
		columns: {
			type: Array,
			default: () => ([])
		},
		// 一维 cells，坐标 + span + render
		cells: {
			type: Array,
			default: () => ([])
		},
		// cells 中最小的绝对行号（grid 第 1 行对应的行号）
		rowStart: {
			type: Number,
			default: 0
		},
		// 固定行高（如 table 的 rowHeight），缺省由内容撑开
		rowHeight: [Number, String],
		role: {
			type: String,
			default: 'rowgroup'
		},
		cellRole: {
			type: String,
			default: 'cell'
		}
	},
	setup(props) {
		const gridTemplateColumns = computed(() => {
			const columns = props.columns as any[];
			return columns
				.map((column: any, index: number) => {
					const width = column.realWidth || column.width || 80;
					// 最后一列 minmax 兜底，容器更宽时由其撑满
					return index === columns.length - 1
						? `minmax(${width}px, 1fr)`
						: `${width}px`;
				})
				.join(' ');
		});

		const rowHeight = computed(() => parseHeight(props.rowHeight as any));

		return () => {
			const columnCount = (props.columns as any[]).length;
			return (
				<div
					class="vc-table__merge-layer"
					role={props.role}
					style={{
						gridTemplateColumns: gridTemplateColumns.value,
						gridAutoRows: rowHeight.value ? `${rowHeight.value}px` : undefined
					}}
				>
					{
						(props.cells as TableMergeCell[]).map((cell) => {
							const rowspan = cell.rowspan || 1;
							const colspan = cell.colspan || 1;
							return (
								<div
									{...(cell.attrs || {})}
									key={cell.key ?? `${cell.rowIndex}:${cell.columnIndex}`}
									role={props.cellRole}
									aria-rowspan={rowspan > 1 ? rowspan : undefined}
									aria-colspan={colspan > 1 ? colspan : undefined}
									class={[
										cell.class,
										{
											'is-grid-first': cell.columnIndex === 0,
											'is-grid-last': cell.columnIndex + colspan >= columnCount
										},
										'vc-table__merge-cell'
									]}
									style={[
										cell.style,
										{
											gridRow: `${cell.rowIndex - props.rowStart + 1} / span ${rowspan}`,
											gridColumn: `${cell.columnIndex + 1} / span ${colspan}`
										}
									]}
								>
									{ cell.render?.(cell) }
								</div>
							);
						})
					}
				</div>
			);
		};
	}
});
