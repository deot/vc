import { defineComponent, computed } from 'vue';
import { useStates } from '../store';

export const TableFooter = defineComponent({
	name: 'vc-table-footer',
	props: {
		getSummary: Function,
		sumText: String,
		border: Boolean,
	},
	setup(props) {
		const states: any = useStates({
			data: 'data',
			columns: 'columns',
			isAllSelected: 'isAllSelected'
		});

		const getRowClasses = (column: any) => {
			const classes = [column.realAlign, column.labelClass];
			if (column.className) {
				classes.push(column.className);
			}
			// 固定列由 is-fixed-* + position: sticky 表达
			if (column.fixed === true || column.fixed === 'left') {
				classes.push('is-fixed-left');
			} else if (column.fixed === 'right') {
				classes.push('is-fixed-right');
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
								states.columns.map((column: any, columnIndex: number) => {
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
