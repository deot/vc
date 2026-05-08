import { defineComponent, inject } from 'vue';
import { TableBodyRow } from './table-body-row';
import { getRowValue } from '../utils';

export const TableBodyMergeRow = defineComponent({
	name: 'vc-table-body-merge-row',
	props: {
		store: { type: Object, required: true },
		columnsHidden: { type: Array, required: true }
	},
	setup(props) {
		const table: any = inject('vc-table');
		const getValueOfRow = (row: any, index: number) => {
			const { primaryKey } = table.props;
			if (primaryKey) {
				return getRowValue(row, primaryKey);
			}
			return index;
		};

		return () => {
			return (
				<div class="vc-table__merge-row">
					{
						props.store.rows.map((row: any) => {
							const key = getValueOfRow(row, row.index);
							return (
								<TableBodyRow
									key={key}
									data={row.data}
									index={row.index}
									height={table.props.rowHeight || row.height}
									columnsHidden={props.columnsHidden}
								/>
							);
						})
					}
				</div>
			);
		};
	}
});
