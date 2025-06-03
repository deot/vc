/** @jsxImportSource vue */

import { defineComponent, computed } from 'vue';

import { getDateTimestamp } from '../../helper/date-utils';
import { value2Array, getMonthEndDay } from '../../helper/utils';

const COMPONENT_NAME = 'vc-month-table';

export const MonthTable = defineComponent({
	name: COMPONENT_NAME,
	props: {
		value: Array,
		panelDate: Date,
		disabledDate: Function,
		cellClassName: Function,
		rangeState: {
			type: Object,
			default: () => ({
				from: null,
				to: null,
				selecting: false,
				marker: null
			})
		},
	},
	emits: [
		'pick',
		'range-change'
	],
	setup(props, { emit }) {
		const getDisabledMonth = (year: number, month: number) => {
			const monthDay = getMonthEndDay(year, month);

			for (let i = 1; i <= monthDay; i++) { // 只要某一天被禁用了,就禁用该月份
				const startDate = new Date(year, month, i, 0, 0, 0);
				const endDate = new Date(year, month, i, 23, 59, 59);
				if (props.disabledDate!(startDate) || props.disabledDate!(endDate)) {
					return true;
				}
			}
			return false;
		};

		const rows = computed(() => {
			const $rows: any = [[], [], [], []];
			const year = props.panelDate!.getFullYear();
			const selectedMonth = value2Array(props.value);
			for (let i = 0; i < 4; i++) {
				for (let j = 0; j < 3; j++) {
					const cell: any = {};
					cell.month = i * 3 + j;
					cell.date = new Date(year, cell.month, 1);
					const time = getDateTimestamp(cell.date);
					cell.inRange = time > getDateTimestamp(props.rangeState.from) && time < getDateTimestamp(props.rangeState.to);
					cell.start = props.rangeState.from && time === getDateTimestamp(props.rangeState.from);
					cell.end = props.rangeState.to && time === getDateTimestamp(props.rangeState.to);
					cell.disabled = typeof props.disabledDate === 'function' && getDisabledMonth(year, cell.month);
					cell.customClass = typeof props.cellClassName === 'function' && props.cellClassName(cell.month);
					cell.selected = selectedMonth.some((month) => {
						return month && (year === month.getFullYear()) && (cell.month === month.getMonth());
					});
					$rows[i][j] = cell;
				}
			}
			return $rows;
		});

		const getCell = (event: any) => {
			let target = event.target;
			if (target.tagName === 'SPAN') {
				target = target.parentNode.parentNode;
			}
			if (target.tagName === 'DIV') {
				target = target.parentNode;
			}
			if (target.tagName !== 'TD') return {};
			const row = target.parentNode.rowIndex;
			const column = target.cellIndex;
			return {
				cell: rows.value[row][column],
				row,
				column
			};
		};

		const getCellClasses = (cell: any) => {
			const classes: string[] = [];
			if (cell.selected || cell.start || cell.end) { classes.push('is-selected'); }
			if (cell.disabled) { classes.push('is-disabled'); }
			if (cell.empty) { classes.push('is-empty'); }
			if (cell.inRange) { classes.push('is-range'); }

			// TODO 其他情况的样式
			return classes.join(' ');
		};

		const handleClick = (event: any) => {
			const { cell } = getCell(event);
			if (!cell) return;
			if (cell.disabled) return;

			emit('pick', cell.date);
		};

		const handleMouseMove = (event: any) => {
			const { cell } = getCell(event);
			if (!cell) return;

			if (!props.rangeState.selecting || cell.disabled) return;

			emit('range-change', cell.date);
		};

		return () => {
			return (
				<div class="vc-month-table">
					<table
						class="vc-month-table__wrapper"
						cellspacing="0"
						cellpadding="0"
						onClick={handleClick}
						onMousemove={handleMouseMove}
					>
						<tbody>
							{
								rows.value.map((row: any, key: number) => {
									return (
										<tr
											key={key}
											class="vc-month-table__row"
										>
											{
												row.map((cell: any, index: number) => {
													return (
														<td
															key={index}
															class={[getCellClasses(cell), 'vc-month-table__cell']}
														>
															<div>
																<span>{`${cell.month + 1}月`}</span>
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
