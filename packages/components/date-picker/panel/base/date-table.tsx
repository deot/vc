/** @jsxImportSource vue */

import { defineComponent, ref, computed } from 'vue';
import { getDateTimestamp, nextDate, prevDate, clearTime } from '../../helper/date-utils';
import { value2Array } from '../../helper/utils';
import { useLocale } from '../../../locale';
import { VcInstance } from '../../../vc';
import { DEFAULT_FIRST_DAY_OF_WEEK, normalizeFirstDayOfWeek, sortWeekdays } from '../../../calendar/utils';

const COMPONENT_NAME = 'vc-date-table';

export const DateTable = defineComponent({
	name: COMPONENT_NAME,
	props: {
		value: Array,
		// 缺省读取全局 DatePicker.firstDayOfWeek，仍缺省为 7
		firstDayOfWeek: {
			type: Number,
			validator: (value: number) => Number.isInteger(value) && value >= 1 && value <= 7
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
		const { t } = useLocale();
		const tableRows = ref([[], [], [], [], [], []]);
		const firstDayOfWeek = computed(() => {
			return props.firstDayOfWeek ?? VcInstance.options.DatePicker?.firstDayOfWeek ?? DEFAULT_FIRST_DAY_OF_WEEK;
		});
		const weeks = computed(() => {
			const labels = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
				.map(day => t(`vc.DatePicker.weekdays.${day}`));
			return sortWeekdays(labels, firstDayOfWeek.value);
		});
		const year = computed(() => {
			return props.panelDate.getFullYear();
		});
		const month = computed(() => {
			return props.panelDate.getMonth();
		});
		// 第一格的日期：当月 1 日往前补到每周第一天（1 日正好是第一天时不补）
		const startDate = computed(() => {
			const first = new Date(year.value, month.value, 1);
			const prevDays = (first.getDay() - normalizeFirstDayOfWeek(firstDayOfWeek.value) + 7) % 7;
			return prevDate(first, prevDays);
		});
		// 生成日期数据
		const rows = computed(() => {
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
					const cellDate = nextDate(startDate.value, i * 7 + j);
					const time = cellDate.getTime();
					cell.inRange = time > getDateTimestamp(props.rangeState.from) && time < getDateTimestamp(props.rangeState.to);
					cell.start = props.rangeState.from && time === getDateTimestamp(props.rangeState.from);
					cell.end = props.rangeState.to && time === getDateTimestamp(props.rangeState.to);
					cell.today = time === now;
					cell.text = cellDate.getDate();

					const offset = (cellDate.getFullYear() - year.value) * 12 + cellDate.getMonth() - month.value;
					if (offset < 0) {
						cell.type = 'prev-month';
					} else if (offset > 0) {
						cell.type = 'next-month';
					}

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
			return nextDate(startDate.value, row * 7 + column);
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
