/** @jsxImportSource vue */

import { defineComponent, inject } from 'vue';

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
			type: Array,
			default: () => ([])
		}
	},
	setup(props) {
		const table: any = inject('vc-table');

		return () => {
			const renderExpand = table.renderExpand.value;
			if (!renderExpand) return null;
			return (props.rows as any[]).map((row: any) => (
				<div
					key={`expand-${row.index}`}
					class="vc-table__tr is-expanded"
					data-row={row.index}
				>
					<div class="vc-table__td vc-table__expanded-cell">
						{
							renderExpand({
								row: row.data,
								rowIndex: row.index,
								store: table.store
							})
						}
					</div>
				</div>
			));
		};
	}
});
