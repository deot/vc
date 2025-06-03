/** @jsxImportSource vue */

import { defineComponent, ref, computed } from 'vue';
import {
	getFirstDayOfMonth, getStartDateOfMonth, getDayCountOfMonth,
	getDateTimestamp, nextDate, clearTime
} from '../../helper/date-utils';
import { value2Array } from '../../helper/utils';
import { WEEKS } from '../../constants';

const COMPONENT_NAME = 'vc-date-table';

export const DateTable = defineComponent({
	name: COMPONENT_NAME,
	props: {
		value: Array,
		firstDayOfWeek: {
			default: 7,
			type: Number,
			validator: (val: number) => val >= 1 && val <= 7
		},
		disabledDate: Function,
		cellClassName: Function,
		panelDate: {
			type: Date,
			required: true,
		},
		focusedDate: {
			type: Date,
			required: true,
		},
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
		const tableRows = ref([[], [], [], [], [], []]);
		const offsetDay = computed(() => {
			const week = props.firstDayOfWeek;
			// 周日为界限，左右偏移的天数，3217654 例如周一就是 -1，目的是调整前两行日期的位置
			return week > 3 ? 7 - week : -week;
		});
		const weeks = computed(() => {
			const week = props.firstDayOfWeek;
			return WEEKS.concat(WEEKS).slice(week, week + 7);
		});
		const year = computed(() => {
			return props.panelDate.getFullYear();
		});
		const month = computed(() => {
			return props.panelDate.getMonth();
		});
		const startDate = computed(() => {
			return getStartDateOfMonth(year.value, month.value);
		});
		// 生成日期数据
		const rows = computed(() => {
			const date = new Date(year.value, month.value, 1);
			const day = getFirstDayOfMonth(date); // 一个月的第一天
			const dateCountOfMonth = getDayCountOfMonth(year.value, month.value);
			const dateCountOfLastMonth = getDayCountOfMonth(
				month.value === 0
					? year.value - 1
					: year.value,
				month.value === 0
					? 11
					: month.value - 1
			);

			let count = 1;

			const $rows: any = tableRows.value;
			// const selectedDate = this.selectionMode === 'dates' ? value2Array(props.value) : [];
			const selectedDate = value2Array(props.value);
			const focusedDate = value2Array(clearTime(props.focusedDate));
			const now = getDateTimestamp(new Date());

			for (let i = 0; i < 6; i++) {
				const row = tableRows.value[i];
				for (let j = 0; j < 7; j++) {
					let cell: any = row[j];
					if (!cell) {
						cell = { row: i, column: j, type: 'normal', inRange: false, start: false, end: false };
					}
					cell.type = 'normal';
					const index = i * 7 + j;
					const time = nextDate(startDate.value, index - offsetDay.value).getTime();
					cell.inRange = time > getDateTimestamp(props.rangeState.from) && time < getDateTimestamp(props.rangeState.to);
					cell.start = props.rangeState.from && time === getDateTimestamp(props.rangeState.from);
					cell.end = props.rangeState.to && time === getDateTimestamp(props.rangeState.to);
					cell.today = time === now;

					if (i >= 0 && i <= 1) {
						const prevDay = day + offsetDay.value < 0 ? 7 + day + offsetDay.value : day + offsetDay.value;
						if (j + i * 7 >= prevDay) {
							cell.text = count++;
						} else {
							cell.text = dateCountOfLastMonth - (prevDay - (j % 7)) + 1 + i * 7;
							cell.type = 'prev-month';
						}
					} else if (count <= dateCountOfMonth) {
						cell.text = count++;
					} else {
						cell.text = count++ - dateCountOfMonth;
						cell.type = 'next-month';
					}

					const cellDate = new Date(time);
					cell.disabled = typeof props.disabledDate === 'function' && props.disabledDate(cellDate);
					cell.customClass = typeof props.cellClassName === 'function' && props.cellClassName(cellDate);
					// 选中的date在进行比较时需要清除 时分秒
					cell.selected = selectedDate.some(($date) => {
						if (cell.type === 'normal') {
							return $date && clearTime($date).getTime() === cellDate.getTime();
						}
						return false;
					});
					cell.focused = focusedDate.some($date => $date.getTime() === cellDate.getTime());

					$rows[i][j] = cell;
				}
			}
			return $rows;
		});
		const getDateOfCell = (row: number, column: number) => {
			const offsetFromStart = row * 7 + column - offsetDay.value;
			return nextDate(startDate.value, offsetFromStart);
		};

		const getCell = (event: any) => {
			let target = event.target;
			if (target.tagName === 'SPAN') {
				target = target.parentNode.parentNode;
			}
			if (target.tagName === 'DIV') {
				target = target.parentNode;
			}
			if (target.tagName !== 'TD') return {};
			const row = target.parentNode.rowIndex - 1;
			const column = target.cellIndex;
			return {
				cell: rows.value[row][column],
				row,
				column
			};
		};

		const getCellClasses = (cell: any) => {
			const classes: string[] = [];

			classes.push(`is-${cell.type}`);
			if (cell.today) classes.push('is-today');
			if ((cell.selected || cell.start || cell.end) && cell.type === 'normal') {
				classes.push('is-selected');
			}
			if (cell.disabled) { classes.push('is-disabled'); }
			if (cell.focused) { classes.push('is-focused'); }
			if (cell.inRange && cell.type === 'normal') {
				classes.push('is-range');
			}

			// TODO 其他情况的样式
			return classes.join(' ');
		};

		const handleClick = (event: any) => {
			const { cell, row, column } = getCell(event);
			if (!cell) return;

			if (cell.disabled || cell.type === 'week') return;

			const newDate = getDateOfCell(row as number, column);
			emit('pick', newDate, cell);
		};

		const handleMouseMove = (event: any) => {
			const { cell, row, column } = getCell(event);
			if (!cell) return;

			if (!props.rangeState.selecting || cell.disabled) return;

			const newDate = getDateOfCell(row as number, column);
			emit('range-change', newDate, cell);
		};

		return () => {
			return (
				<div class="vc-date-table">
					<table
						cellspacing="0"
						cellpadding="0"
						class="vc-date-table__wrapper"
						onClick={handleClick}
						onMousemove={handleMouseMove}
					>
						<tbody>
							<tr class="vc-date-table__header">
								{
									weeks.value.map((week, index) => {
										return (
											<th key={index}>
												{week}
											</th>
										);
									})
								}
							</tr>
							{
								rows.value.map((row: any, key: number) => {
									return (
										<tr
											key={key}
											class="vc-date-table__row"
										>
											{
												row.map((cell: any, index: number) => {
													return (
														<td
															key={index}
															class={[getCellClasses(cell), 'vc-date-table__cell']}
														>
															<div>
																<span>
																	{cell.text}
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
