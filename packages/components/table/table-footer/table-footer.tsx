import { defineComponent, computed } from 'vue';
import type { PropType } from 'vue';
import { useStates } from '../store';
import type { TableColumnNode, TableColumnStates } from '../table-column/table-column-node';

export const TableFooter = defineComponent({
	name: 'vc-table-footer',
	props: {
		getSummary: Function as PropType<(data: { columns: TableColumnStates[]; data: Record<string, unknown>[] }) => (string | number)[]>,
		sumText: String,
		border: Boolean,
	},
	setup(props) {
		const states = useStates({
			data: 'data',
			columns: 'columns',
			isAllSelected: 'isAllSelected'
		});

		const getRowClasses = (column: TableColumnStates) => {
			const classes: (string | null | undefined)[] = [column.realAlign, column.labelClass];
			// 固定列由 is-fixed-* + position: sticky 表达
			if (column.fixed === true || column.fixed === 'left') {
				classes.push('is-fixed-left');
			} else if (column.fixed === 'right') {
				classes.push('is-fixed-right');
			}
			// columns 为叶子列，恒为 is-leaf
			classes.push('is-leaf');
			return classes;
		};

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

		return () => {
			return (
				<div
					class="vc-table__footer"
					cellspacing="0"
					cellpadding="0"
					border="0"
				>
					<div class="vc-table__tbody">
						<div class="vc-table__tr">
							{
								states.columns.map((node, columnIndex) => {
									const column = node.states;
									return (
										<div
											key={columnIndex}
											class={[getRowClasses(column), 'vc-table__td']}
											style={[{ width: `${column.realWidth}px`, height: `44px` }, column.stickyStyle]}
										>
											<div class={['vc-table__cell', column.labelClass]}>
												{ sums.value[columnIndex] }
											</div>
										</div>
									);
								})
							}
						</div>
					</div>
				</div>
			);
		};
	},

});
