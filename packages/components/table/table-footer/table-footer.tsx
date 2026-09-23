import { defineComponent, computed } from 'vue';
import type { PropType } from 'vue';
import { useStates } from '../store';
import { TableGrid } from '../table-grid';
import type { TableColumnStates } from '../table-column/table-column-node';

export const TableFooter = defineComponent({
	name: 'vc-table-footer',
	props: {
		getSummary: Function as PropType<(data: { columns: TableColumnStates[]; data: Record<string, unknown>[] }) => (string | number)[]>,
		sumText: String
	},
	setup(props) {
		const states = useStates({
			data: 'data',
			columns: 'columns'
		});

		const sums = computed(() => {
			let v: (string | number | undefined)[] = [];
			const columnStates = states.columns.map(node => node.states);
			if (props.getSummary) {
				v = props.getSummary({ columns: columnStates, data: states.data });
			} else {
				columnStates.forEach((column, index) => {
					if (index === 0) {
						v[index] = props.sumText;
						return;
					}
					const values = states.data.map(item => Number(item[column.prop!]));
					const precisions: number[] = [];
					let notNumber = true;
					values.forEach((value) => {
						if (!isNaN(value)) {
							notNumber = false;
							const decimal = ('' + value).split('.')[1];
							precisions.push(decimal ? decimal.length : 0);
						}
					});
					const precision = Math.max.apply(null, precisions);
					if (!notNumber) {
						v[index] = values.reduce((prev, curr) => {
							const value = Number(curr);
							if (!isNaN(value)) {
								return parseFloat((prev + curr).toFixed(Math.min(precision, 20)));
							} else {
								return prev;
							}
						}, 0);
					} else {
						v[index] = '';
					}
				});
			}
			return v;
		});

		/**
		 * 与表头 / 表体共用 TableGrid：列宽走表根的 --vc-table-columns，首末列内边距由 is-grid-first/last 补；
		 * 固定列由 layout 写入的 stickyClass（含交界阴影类）+ stickyStyle 表达
		 * @returns 合计行 cells
		 */
		const buildCells = () => {
			return states.columns.map((node, columnIndex) => {
				const column = node.states;
				return {
					key: column.id,
					rowIndex: 0,
					columnIndex,
					// columns 为叶子列，恒为 is-leaf
					class: [column.realAlign, column.labelClass, column.stickyClass, 'is-leaf', 'vc-table__td'],
					style: column.stickyStyle,
					render: () => (
						<div class={['vc-table__cell', column.labelClass]}>
							{ sums.value[columnIndex] }
						</div>
					)
				};
			});
		};

		return () => {
			return (
				<div class="vc-table__footer">
					<div class="vc-table__tbody">
						<TableGrid
							class="vc-table__tr"
							role="row"
							columns={states.columns}
							cells={buildCells()}
						/>
					</div>
				</div>
			);
		};
	},

});
