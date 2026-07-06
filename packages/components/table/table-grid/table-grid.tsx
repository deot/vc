/** @jsxImportSource vue */

import { defineComponent, computed, inject } from 'vue';
import type { PropType } from 'vue';
import type { TableGridCell } from './table-grid-cell';
import type { TableColumnNode } from '../table-column/table-column-node';
import { parseHeight, computeGridTemplateColumns } from '../utils';

const COMPONENT_NAME = 'vc-table-grid';

/**
 * 基于 CSS Grid 的公共布局层，header（多级表头）与 body（getSpan 合并块）共用。
 * - 列宽模板单源：表格内消费表根的 `--vc-table-columns` CSS 变量（layout 统一产出，
 *   列宽变化只写表根一个节点）；独立使用时回退为按 columns 本地计算；
 * - cell 定位使用 grid-row/column-start + span，anchor cell 上输出 aria-rowspan/aria-colspan；
 * - rowStart 为虚拟化扩展点：cells 的 rowIndex 为绝对行号，按 rowStart 平移映射 grid 行号，
 *   未来若 RecycleList 支持跨窗口 anchor，可直接以窗口起始行号作为 rowStart 渲染窗口内 cells。
 */
export const TableGrid = defineComponent({
	name: COMPONENT_NAME,
	props: {
		// 列对象数组，仅消费 realWidth（表格内仅用于 columnCount，模板走 CSS 变量）
		columns: {
			type: Array as PropType<TableColumnNode[]>,
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
		const table = inject('vc-table', null);

		// 独立使用时本地模板兜底；表格内走 CSS 变量
		const localTemplateColumns = computed(() => computeGridTemplateColumns(props.columns));

		const gridTemplateColumns = computed(() => table ? 'var(--vc-table-columns)' : localTemplateColumns.value);
		const rowHeight = computed(() => parseHeight(props.rowHeight));

		return () => {
			const columnCount = props.columns.length;
			return (
				<div
					class="vc-table__grid"
					role={props.role}
					style={{
						gridTemplateColumns: gridTemplateColumns.value,
						gridAutoRows: rowHeight.value ? `${rowHeight.value}px` : void 0
					}}
				>
					{
						(props.cells as TableGridCell[]).map((cell) => {
							const rowspan = cell.rowspan || 1;
							const colspan = cell.colspan || 1;
							return (
								<div
									{...(cell.attrs || {})}
									key={cell.key ?? `${cell.rowIndex}:${cell.columnIndex}`}
									role={props.cellRole}
									aria-rowspan={rowspan > 1 ? rowspan : void 0}
									aria-colspan={colspan > 1 ? colspan : void 0}
									class={[
										cell.class,
										{
											'is-grid-first': cell.columnIndex === 0,
											'is-grid-last': cell.columnIndex + colspan >= columnCount
										}
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
