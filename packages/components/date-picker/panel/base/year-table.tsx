/** @jsxImportSource vue */

import { defineComponent, computed } from 'vue';

import { value2Array } from '../../helper/utils';

const COMPONENT_NAME = 'vc-year-table';

export const YearTable = defineComponent({
	name: COMPONENT_NAME,
	props: {
		value: Array,
		panelDate: Date,
		disabledDate: Function,
		cellClassName: Function,
	},
	emits: [
		'pick'
	],
	setup(props, { emit }) {
		const startYear = computed(() => {
			return Math.floor(props.panelDate!.getFullYear() / 10) * 10;
		});

		const rows = computed(() => {
			const $rows: any = [[], [], [], []];
			const selectedYear = value2Array(props.value);
			for (let i = 0; i < 4; i++) {
				for (let j = 0; j < 3; j++) {
					const cell: any = {};
					if (i < 3 || j === 0) {
						cell.year = startYear.value + i * 3 + j;
					}
					cell.date = new Date(cell.year, 0, 1);
					cell.disabled = typeof props.disabledDate === 'function' && props.disabledDate(cell.year);
					cell.customClass = typeof props.cellClassName === 'function' && props.cellClassName(cell.year);
					cell.selected = selectedYear.some((year) => {
						return year && cell.year === year.getFullYear();
					});
					cell.empty = !cell.year;
					$rows[i][j] = cell;
				}
			}
			return $rows;
		});

		const getCellClasses = (cell: any) => {
			const classes: string[] = [];
			if (cell.selected) { classes.push('is-selected'); }
			if (cell.disabled) { classes.push('is-disabled'); }
			if (cell.empty) { classes.push('is-empty'); }

			// TODO 其他情况的样式
			return classes.join(' ');
		};

		const handleYearTableClick = (cell: any) => {
			if (cell.disabled || cell.empty) return;

			emit('pick', cell.date);
		};

		return () => {
			return (
				<div class="vc-year-table">
					<table
						class="vc-year-table__wrapper"
						cellspacing="0"
						cellpadding="0"
					>
						<tbody>
							{
								rows.value.map((row: any, key: number) => {
									return (
										<tr
											key={key}
											class="vc-year-table__row"
										>
											{
												row.map((cell: any, index: number) => {
													return (
														<td
															key={index}
															class={[getCellClasses(cell), 'vc-year-table__cell']}
															onClick={() => handleYearTableClick(cell)}
														>
															<div>
																<span>
																	{cell.year}
																</span>
															</div>
														</td>
													);
												})
											}
										</tr>
									);
								})
							}
						</tbody>
					</table>
				</div>
			);
		};
	}
});
