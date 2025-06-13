import { defineComponent, computed, inject } from 'vue';
import { useStates } from './store';

export const TableFooter = defineComponent({
	name: 'vc-table-footer',
	props: {
		fixed: [String, Boolean],
		getSummary: Function,
		sumText: String,
		border: Boolean,
	},
	setup(props) {
		const table: any = inject('vc-table');
		const states: any = useStates({
			data: 'data',
			columns: 'columns',
			isAllSelected: 'isAllSelected',
			leftFixedLeafCount: 'leftFixedLeafColumnsLength',
			rightFixedLeafCount: 'rightFixedLeafColumnsLength',
			columnsCount: $states => $states.columns.length,
			leftFixedCount: $states => $states.leftFixedColumns.length,
			rightFixedCount: $states => $states.rightFixedColumns.length
		});

		const isColumnHidden = (column: any, index: number) => {
			if (props.fixed === true || props.fixed === 'left') {
				return index >= states.leftFixedLeafCount;
			} else if (props.fixed === 'right') {
				let before = 0;
				for (let i = 0; i < index; i++) {
					before += states.columns[i].colspan;
				}
				return before < states.columnsCount - states.rightFixedLeafCount;
			} else if (!props.fixed && column.fixed) {
				return true;
			} else {
				return (index < states.leftFixedCount) || (index >= states.columnsCount - states.rightFixedCount);
			}
		};

		const columnsHidden = computed(() => states.columns.map(isColumnHidden));

		const getRowClasses = (column: any, columnIndex: number) => {
			const classes = [column.realAlign, column.labelClass];
			if (column.className) {
				classes.push(column.className);
			}
			if (columnsHidden.value[columnIndex]) {
				classes.push('is-hidden');
			}
			if (!column.children) {
				classes.push('is-leaf');
			}
			return classes;
		};

		const sums = computed(() => {
			let v: any[] = [];
			if (props.getSummary) {
				v = props.getSummary({ columns: states.columns, data: states.data });
			} else {
				states.columns.forEach((column: any, index: number) => {
					if (index === 0) {
						v[index] = props.sumText;
						return;
					}
					const values = states.data.map(item => Number(item[column.prop]));
					const precisions: any[] = [];
					let notNumber = true;
					values.forEach((value: any) => {
						if (!isNaN(value)) {
							notNumber = false;
							const decimal = ('' + value).split('.')[1];
							precisions.push(decimal ? decimal.length : 0);
						}
					});
					const precision = Math.max.apply(null, precisions);
					if (!notNumber) {
						v[index] = values.reduce((prev: any, curr: any) => {
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
								states.columns.map((column: any, columnIndex: number) => (
									<div
										key={columnIndex}
										class={[getRowClasses(column, columnIndex), 'vc-table__td']}
										style={[{ width: `${column.realWidth}px`, height: `44px` }]}
									>
										<div class={['vc-table__cell', column.labelClass]}>
											{ sums.value[columnIndex] }
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
