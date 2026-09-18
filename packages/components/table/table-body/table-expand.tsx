/** @jsxImportSource vue */

import { defineComponent, inject } from 'vue';
import type { PropType } from 'vue';
import type { TableProvide } from '../types';
import type { TableColumnStates } from '../table-column/table-column-node';

/**
 * 展开行内容：作为块内 `<TableGrid />` 的兄弟节点渲染，
 * 每个展开行输出一条全宽内容行（`vc-table__tr is-expanded` + 全宽 cell）。
 * 高度变化由块级 Resize 观察自然回馈到虚拟化布局。
 */
export const TableExpand = defineComponent({
	name: 'vc-table-expand',
	props: {
		// 块内已展开的行（{ index, data }）
		rows: {
			type: Array as PropType<Array<{ index: number; data: Record<string, unknown> }>>,
			default: () => ([])
		},
		// expand 列的展开内容渲染函数
		render: {
			type: Function as PropType<NonNullable<TableColumnStates['renderExpand']>>,
			required: true
		}
	},
	setup(props) {
		const table = inject<TableProvide>('vc-table')!;

		return () => props.rows.map(row => (
			<div
				key={`expand-${row.index}`}
				class="vc-table__tr is-expanded"
				data-row={row.index}
			>
				<div class="vc-table__td vc-table__expanded-cell">
					{ props.render({ row: row.data, rowIndex: row.index, store: table.store }) }
				</div>
			</div>
		));
	}
});
