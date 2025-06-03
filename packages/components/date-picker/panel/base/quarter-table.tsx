/** @jsxImportSource vue */

import { defineComponent, ref, computed } from 'vue';
import { getDayCountOfMonth, getDateTimestamp } from '../../helper/date-utils';
import { value2Array, isEmpty } from '../../helper/utils';
import { QUARTER_CN } from '../../constants';

const COMPONENT_NAME = 'vc-quarter-table';

/**
 * 获取季度对应的月份范围
 * @param panelDate ~
 * @param quarter ~
 * @returns ~
 */
const getMonthRange = (panelDate: Date, quarter: number) => {
	const year = panelDate.getFullYear();
	const [startMonth, endMonth] = [quarter * 3, quarter * 3 + 2];
	const endDay = getDayCountOfMonth(year, endMonth);
	return [
		new Date(year, startMonth),
		new Date(year, endMonth, endDay)
	];
};

const getQuarterRangeByMonth = (value: Date) => {
	const month = value.getMonth();
	switch (month) {
		case 0:
		case 2:
			return 0;
		case 3:
		case 5:
			return 1;
		case 6:
		case 8:
			return 2;
		case 9:
		case 11:
			return 3;
		default:
			return false;
	}
};
export const QuarterTable = defineComponent({
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
		const quarterMap = ref(QUARTER_CN);
		const rows = computed(() => {
			const $rows: any = [[], []];
			const year = props.panelDate!.getFullYear();
			const selectedQuarter = value2Array(props.value);
			for (let i = 0; i < 2; i++) {
				for (let j = 0; j < 2; j++) {
					const cell: any = {};
					cell.quarter = i * 2 + j; // 值为：0，1，2，3
					cell.dates = getMonthRange(props.panelDate!, cell.quarter);
					const rangeFromTime = getDateTimestamp(props.rangeState.from);
					const rangeToTime = getDateTimestamp(props.rangeState.to);
					const time = [getDateTimestamp(cell.dates[0]), getDateTimestamp(cell.dates[1])];

					cell.inRange = time[0] > rangeFromTime && time[1] < rangeToTime;
					cell.start = props.rangeState.from && time[0] === rangeFromTime;
					cell.end = props.rangeState.to && time[1] === rangeToTime;
					cell.disabled = typeof props.disabledDate === 'function' && props.disabledDate(cell.quarter);
					cell.customClass = typeof props.cellClassName === 'function' && props.cellClassName(cell.quarter);
					cell.selected = !isEmpty(selectedQuarter) && selectedQuarter.some((quarter) => {
						return (year === quarter.getFullYear()) && getQuarterRangeByMonth(quarter) === cell.quarter;
					});
					$rows[i][j] = cell;
				}
			}
			return $rows;
		});

		const getCellClasses = (cell: any) => {
			const classes: string[] = [];
			if (cell.selected || cell.start || cell.end) { classes.push('is-selected'); }
			if (cell.disabled) { classes.push('is-disabled'); }
			if (cell.empty) { classes.push('is-empty'); }
			if (cell.inRange) { classes.push('is-range'); }

			// TODO 其他情况的样式
			return classes.join(' ');
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
			const row = target.parentNode.rowIndex;
			const column = target.cellIndex;
			return {
				cell: rows.value[row][column],
				row,
				column
			};
		};

		const handleClick = (event: any) => {
			const { cell } = getCell(event);
			if (!cell) return;
			if (cell.disabled) return;

			emit('pick', cell.dates);
		};

		const handleMouseMove = (event: any) => {
			const { cell } = getCell(event);
			if (!cell) return;

			if (!props.rangeState.selecting || cell.disabled) return;

			emit('range-change', cell.dates);
		};

		return () => {
			return (
				<div class="vc-quarter-table">
					<table
						class="vc-quarter-table__wrapper"
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
											class="vc-quarter-table__row"
										>
											{
												row.map((cell: any, index: number) => {
													return (
														<td
															key={index}
															class={[getCellClasses(cell), 'vc-quarter-table__cell']}
														>
															<div>
																<span>{`第${quarterMap.value[cell.quarter + 1]}季度`}</span>
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
