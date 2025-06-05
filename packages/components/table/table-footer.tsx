import { defineComponent } from 'vue';
import { useStates } from './store';

export const TableFooter = defineComponent({
	name: 'vc-table-footer',
	props: {
		fixed: [String, Boolean],
		store: {
			type: Object,
			required: true
		},
		getSummary: Function,
		sumText: String,
		border: Boolean,
	},
	setup(props) {
		const states: any = useStates({
			data: 'data',
			columns: 'columns',
			isAllSelected: 'isAllSelected',
			leftFixedLeafCount: 'fixedLeafColumnsLength',
			rightFixedLeafCount: 'rightFixedLeafColumnsLength',
			columnsCount: $states => $states.columns.length,
			leftFixedCount: $states => $states.fixedColumns.length,
			rightFixedCount: $states => $states.rightFixedColumns.length
		});

		const isCellHidden = (index, columns, column) => {
			if (props.fixed === true || props.fixed === 'left') {
				return index >= states.leftFixedLeafCount;
			} else if (props.fixed === 'right') {
				let before = 0;
				for (let i = 0; i < index; i++) {
					before += columns[i].colSpan;
				}
				return before < states.columnsCount - states.rightFixedLeafCount;
			} else if (!props.fixed && column.fixed) { // hide cell when footer instance is not fixed and column is fixed
				return true;
			} else {
				return (index < states.leftFixedCount) || (index >= states.columnsCount - states.rightFixedCount);
			}
		};

		const getRowClasses = (column, cellIndex) => {
			const classes = [column.id, column.align, column.labelClass];
			if (column.className) {
				classes.push(column.className);
			}
			if (isCellHidden(cellIndex, states.columns, column)) {
				classes.push('is-hidden');
			}
			if (!column.children) {
				classes.push('is-leaf');
			}
			return classes;
		};

		return () => {
			let sums: any[] = [];
			if (props.getSummary) {
				sums = props.getSummary({ columns: states.columns, data: states.data });
			} else {
				states.columns.forEach((column, index) => {
					if (index === 0) {
						sums[index] = props.sumText;
						return;
					}
					const values = states.data.map(item => Number(item[column.prop]));
					const precisions: any[] = [];
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
						sums[index] = values.reduce((prev, curr) => {
							const value = Number(curr);
							if (!isNaN(value)) {
								return parseFloat((prev + curr).toFixed(Math.min(precision, 20)));
							} else {
								return prev;
							}
						}, 0);
					} else {
						sums[index] = '';
					}
				});
			}

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
								states.columns.map((column, cellIndex) => (
									<div
										key={cellIndex}
										colspan={column.colSpan}
										rowspan={column.rowSpan}
										class={[getRowClasses(column, cellIndex), 'vc-table__td']}
										style={[{ width: `${column.realWidth}px` }]}
									>
										<div class={['vc-table__cell', column.labelClass]}>
											{
												sums[cellIndex]
											}
										</div>
									</div>
								))
							}
						</div>
					</div>
				</div>
			);
		};
	},

});
