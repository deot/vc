/** @jsxImportSource vue */

import { defineComponent, ref, computed } from 'vue';
import { nextMonth, prevMonth, nextYear, prevYear, getDateOfTime, changeYearMonthAndClampDate } from '../helper/date-utils';

import { props as dateProps } from './base-date-props';
import { YearTable, MonthTable, DateTable, DateHeader, Confirm, TimeSelect, ShortcutsSelect } from './base';

const isEqualYearAndMonth = (value: any) => {
	if (!value[0] || !value[1]) { return false; }
	const startYear = value[0].getFullYear();
	const startMonth = value[0].getMonth();
	const endYear = value[1].getFullYear();
	const endMonth = value[1].getMonth();
	return startYear === endYear && startMonth === endMonth;
};

const isOverRightPanel = (panelDate: Date, rightPanelDate: Date) => {
	const panelYear = panelDate.getFullYear();
	const panelMonth = panelDate.getMonth();
	const rightPanelYear = rightPanelDate.getFullYear();
	const rightPanelMonth = rightPanelDate.getMonth();
	return panelYear > rightPanelYear || (panelYear === rightPanelYear && panelMonth >= rightPanelMonth);
};

const isOverLeftPanel = (panelDate: Date, leftPanelDate: Date) => {
	const panelYear = panelDate.getFullYear();
	const panelMonth = panelDate.getMonth();
	const leftPanelYear = leftPanelDate.getFullYear();
	const leftPanelMonth = leftPanelDate.getMonth();
	return panelYear < leftPanelYear || (panelYear === leftPanelYear && panelMonth <= leftPanelMonth);
};

// 判断当前点击的cell是否在当前面板内
const getDateIsInRange = (value: Date, type: string, leftPanelDate: Date, rightPanelDate: Date) => {
	const month = value.getMonth();
	const year = value.getFullYear();
	const $leftMonth = leftPanelDate.getMonth();
	const $leftYear = leftPanelDate.getFullYear();
	const $rightMonth = rightPanelDate.getMonth();
	const $rightYear = rightPanelDate.getFullYear();
	if (type === 'right' && (year > $rightYear || (year === $rightYear && month > $rightMonth))) {
		return false;
	} else if (type === 'right' && (year < $leftYear || (year === $leftYear && month < $leftMonth))) {
		return false;
	} else if (type === 'left' && (year < $leftYear || (year === $leftYear && month < $leftMonth))) {
		return false;
	} else if (type === 'left' && (year > $rightYear || (year === $rightYear && month > $rightMonth))) {
		return false;
	}
	return true;
};

const COMPONENT_NAME = 'vc-date-range-panel';

export const DateRangePanel = defineComponent({
	name: COMPONENT_NAME,
	props: {
		...dateProps,
		confirm: {
			type: Boolean,
			default: false
		},
		splitPanels: {
			type: Boolean,
			default: false
		},
	},
	emits: [
		'pick',
		'clear',
		'ok'
	],
	setup(props, { emit }) {
		const dates = ref(props.value!);
		const leftPanelDate = ref(props.value![0] || props.startDate! || new Date());
		const rightPanelDate = ref(
			props.splitPanels && !isEqualYearAndMonth(props.value)
				? props.value![1] || nextMonth(leftPanelDate.value)
				: nextMonth(leftPanelDate.value)
		);
		const rangeState = ref<any>({
			from: props.value![0] || '',
			to: props.value![1] || '',
			selecting: false,
			marker: null, // 第一次点下的日期
		});
		const rightCurrentView = ref('daterange');
		const leftCurrentView = ref('daterange');

		const canSelectTime = computed(() => {
			const { from, to, selecting } = rangeState.value;
			return props.showTime && !!from && !!to && !selecting;
		});
		const showSeconds = computed(() => {
			return !(props.format || '').match(/mm$/);
		});

		const timeSlots = computed(() => {
			const leftDate = dates.value[0];
			const rightDate = dates.value[1];
			if (!leftDate || !rightDate || (rightCurrentView.value !== 'timerange' && leftCurrentView.value !== 'timerange')) {
				return {
					left: {},
					right: {}
				};
			}
			return {
				left: {
					hours: leftDate.getHours(),
					minutes: leftDate.getMinutes(),
					seconds: leftDate.getSeconds()
				},
				right: {
					hours: rightDate.getHours(),
					minutes: rightDate.getMinutes(),
					seconds: rightDate.getSeconds()
				},
			};
		});
		const leftMonth = computed(() => {
			return leftPanelDate.value.getMonth();
		});
		const leftYear = computed(() => {
			return leftPanelDate.value.getFullYear();
		});
		const rightMonth = computed(() => {
			return rightPanelDate.value.getMonth();
		});
		const rightYear = computed(() => {
			return rightPanelDate.value.getFullYear();
		});

		const handleChangeLeftCurrentView = (currentView: string) => {
			if (leftCurrentView.value === currentView) {
				leftCurrentView.value = 'daterange';
			} else {
				leftCurrentView.value = currentView;
			}
		};

		const handleLeftYearPick = (value: Date) => {
			const leftDate = changeYearMonthAndClampDate(dates.value[0] || leftPanelDate.value, value.getFullYear(), leftMonth.value);
			leftPanelDate.value = leftDate;
			leftCurrentView.value = 'month';
			if (!props.splitPanels) {
				const rightDate = changeYearMonthAndClampDate(dates.value[1] || rightPanelDate.value, value.getFullYear(), rightMonth.value);
				rightPanelDate.value = rightDate;
			}
		};

		const handleLeftMonthPick = (value: Date) => {
			const leftDate = changeYearMonthAndClampDate(dates.value[0] || leftPanelDate.value, leftYear.value, value.getMonth());
			leftPanelDate.value = leftDate;
			leftCurrentView.value = 'daterange';
			if (!props.splitPanels) {
				const rightDate = changeYearMonthAndClampDate(dates.value[1] || rightPanelDate.value, leftYear.value, leftMonth.value + 1);
				rightPanelDate.value = rightDate;
			}
		};

		const handleChangeRightCurrentView = (currentView: string) => {
			if (rightCurrentView.value === currentView) {
				rightCurrentView.value = 'daterange';
			} else {
				rightCurrentView.value = currentView;
			}
		};

		const handleRightYearPick = (value: Date) => {
			const rightDate = changeYearMonthAndClampDate(dates.value[1] || rightPanelDate.value, value.getFullYear(), rightMonth.value);
			rightPanelDate.value = rightDate;
			rightCurrentView.value = 'month';
			if (!props.splitPanels) {
				const leftDate = changeYearMonthAndClampDate(dates.value[0] || leftPanelDate.value, value.getFullYear(), leftMonth.value);
				leftPanelDate.value = leftDate;
			}
		};

		const handleRightMonthPick = (value: Date) => {
			const newDate = changeYearMonthAndClampDate(dates.value[1] || rightPanelDate.value, rightYear.value, value.getMonth());
			rightPanelDate.value = newDate;
			rightCurrentView.value = 'daterange';
			if (!props.splitPanels) {
				const leftDate = changeYearMonthAndClampDate(dates.value[1] || leftPanelDate.value, rightYear.value, rightMonth.value - 1);
				leftPanelDate.value = leftDate;
			}
		};

		const handlePanelChange = (panelDate: Date, type: string, position: string) => {
			position === 'left'
				? (leftPanelDate.value = panelDate)
				: (rightPanelDate.value = panelDate);

			if (props.splitPanels) { // 左右面板不联动
				const $isOverRightPanel = isOverRightPanel(panelDate, rightPanelDate.value);
				const $isOverLeftPanel = isOverLeftPanel(panelDate, leftPanelDate.value);

				switch (type) {
					case 'prev-month':
					case 'next-month':
						if (position === 'left' && $isOverRightPanel) {
							// 判断如果右边下个月的日期还是小于左边的日期，则将右边日期改成比左边日期大一个月
							const $rightPanelDate = nextMonth(rightPanelDate.value);
							if ($rightPanelDate < leftPanelDate.value) {
								rightPanelDate.value = changeYearMonthAndClampDate(leftPanelDate.value, leftYear.value, leftMonth.value + 1);
							} else {
								rightPanelDate.value = nextMonth(rightPanelDate.value);
							}
						} else if (position === 'right' && $isOverLeftPanel) {
							// 判断如果左边上个月的日期还是大于右边的日期，则将左边日期改成比右边日期小一个月
							const $leftPanelDate = prevMonth(leftPanelDate.value);
							if ($leftPanelDate < leftPanelDate.value) {
								leftPanelDate.value = changeYearMonthAndClampDate(rightPanelDate.value, rightYear.value, rightMonth.value - 1);
							} else {
								leftPanelDate.value = prevMonth(leftPanelDate.value);
							}
						}
						break;
					case 'prev-year':
					case 'next-year':
						if (position === 'left' && $isOverRightPanel && leftCurrentView.value !== 'year') {
							// 判断如果右边下年的日期还是小于左边的日期，则将右边日期改成比左边日期大一月
							const $rightPanelDate = nextYear(rightPanelDate.value);
							if ($rightPanelDate < leftPanelDate.value) {
								rightPanelDate.value = changeYearMonthAndClampDate(leftPanelDate.value, leftYear.value, leftMonth.value + 1);
							} else {
								rightPanelDate.value = nextYear(rightPanelDate.value);
							}
						} else if (position === 'right' && $isOverRightPanel && rightCurrentView.value !== 'year') {
							// 判断如果左边上个月的日期还是大于右边的日期，则将左边日期改成比右边日期小一个月
							const $leftPanelDate = prevYear(leftPanelDate.value);
							if ($leftPanelDate < leftPanelDate.value) {
								leftPanelDate.value = changeYearMonthAndClampDate(rightPanelDate.value, rightYear.value, rightMonth.value - 1);
							} else {
								leftPanelDate.value = prevYear(leftPanelDate.value);
							}
						}
						break;
					default:
						break;
				}
			} else {
				switch (type) {
					case 'prev-month':
						rightPanelDate.value = prevMonth(rightPanelDate.value);
						break;
					case 'prev-year':
						rightPanelDate.value = prevYear(rightPanelDate.value);
						break;
					case 'next-month':
						leftPanelDate.value = nextMonth(leftPanelDate.value);
						break;
					case 'next-year':
						leftPanelDate.value = nextYear(leftPanelDate.value);
						break;
					default:
						break;
				}
			}
		};
		/**
		 * 重新选择日期范围后需要重新选择时间范围
		 * @param value ~~
		 * @param cell ~
		 * @param type ~
		 */
		const handlePick = (value: any, cell: any, type: string) => {
			const { selecting, from, marker } = rangeState.value;
			const isInRange = getDateIsInRange(value, type, leftPanelDate.value, rightPanelDate.value);
			if (!selecting) {
				dates.value = [];
				rangeState.value = {
					from: value,
					to: '',
					selecting: true,
					marker: value
				};
			} else {
				rangeState.value = {
					from: value < marker! ? value : from,
					to: value < marker! ? marker : value,
					selecting: cell.type !== 'normal',
					marker: cell.type !== 'normal' ? marker : null
				};
			}
			if (!isInRange) {
				const changeType = type === 'left' ? 'prev-month' : 'next-month';
				const panelDate = type === 'left' ? prevMonth(leftPanelDate.value) : nextMonth(rightPanelDate.value);
				handlePanelChange(panelDate, changeType, type);
			} else if (rangeState.value.from && rangeState.value.to) {
				// from && to 都已选择，对外发送事件
				const leftDate = rangeState.value.from;
				const rightDate = rangeState.value.to;
				dates.value = [leftDate, rightDate];
				emit('pick', dates.value);
			}
		};

		const handleRangeChange = (value: any) => {
			const { from, marker } = rangeState.value;
			if (rangeState.value.selecting && value.getTime() != from.getTime()) {
				rangeState.value = {
					from: value < marker! ? value : marker,
					to: value < marker! ? marker : value,
					selecting: true,
					marker
				};
			}
		};

		const handleTimePick = (type: string, value: any) => {
			const date = type === 'left' ? dates.value[0] : dates.value[1];
			let leftNewDate = dates.value[0];
			let rightNewDate = dates.value[1];
			if (type === 'left') {
				leftNewDate = getDateOfTime(date, value);
				leftPanelDate.value = leftNewDate;
			} else if (type === 'right') {
				rightNewDate = getDateOfTime(date, value);
				rightPanelDate.value = rightNewDate;
			}
			if (leftNewDate && rightNewDate) {
				dates.value = [leftNewDate, rightNewDate];
				emit('pick', dates.value);
			}
		};

		const handleToggleTime = (view: string[]) => {
			leftCurrentView.value = view[0];
			rightCurrentView.value = view[1];
		};

		const handleClear = () => {
			emit('clear');
		};
		const handleOK = () => {
			emit('ok', dates.value);
		};
		const handleShortcutPick = (value: any[]) => {
			// if (type === 'disabled') {
			// 	return;
			// }
			if (props.disabledDate(value[0]) || props.disabledDate(value[1])) {
				return;
			}
			handlePick(value[0], { type: props.disabledDate(value[0]) ? 'disabled' : 'normal' }, 'left');
			handlePick(value[1], { type: props.disabledDate(value[1]) ? 'disabled' : 'normal' }, 'right');
			leftPanelDate.value = value[0];
			rightPanelDate.value = value[1];
			dates.value = value;
			// emit('pick', dates.value);
		};

		return () => {
			return (
				<div class="vc-daterange-panel">
					{
						props.shortcuts && props.shortcuts.length > 0 && (
							<div style="width: 100px">
								<ShortcutsSelect
									config={props.shortcuts}
									onPick={handleShortcutPick}
								/>
							</div>
						)
					}
					<div class={[{ 'is-with-seconds': showSeconds.value }, 'vc-daterange-panel__body']}>
						<div class="vc-daterange-panel__table">
							<div class="vc-daterange-panel__content is-left">
								<DateHeader
									currentView={leftCurrentView.value}
									panelDate={leftPanelDate.value}
									showNext={props.splitPanels}
									title="开始时间"
									onChange={(panelDate, type) => handlePanelChange(panelDate, type, 'left')}
									// @ts-ignore
									onChangeCurrentView={handleChangeLeftCurrentView}
								/>
								{
									leftCurrentView.value === 'daterange' && (
										<DateTable
											value={dates.value}
											panelDate={leftPanelDate.value}
											disabledDate={props.disabledDate}
											focusedDate={props.focusedDate as Date}
											rangeState={rangeState.value}
											onPick={(value, cell) => handlePick(value, cell, 'left')}
											// @ts-ignore
											onRangeChange={handleRangeChange}
										/>
									)
								}
								{
									leftCurrentView.value === 'year' && (
										<YearTable
											value={[dates.value[0]]}
											panelDate={leftPanelDate.value}
											onPick={handleLeftYearPick}
										/>
									)
								}
								{
									leftCurrentView.value === 'month' && (
										<MonthTable
											value={[dates.value[0]]}
											panelDate={leftPanelDate.value}
											onPick={handleLeftMonthPick}
										/>
									)
								}

								<TimeSelect
									// @ts-ignore
									vShow={leftCurrentView.value === 'timerange'}
									hours={timeSlots.value.left.hours}
									minutes={timeSlots.value.left.minutes}
									seconds={timeSlots.value.left.seconds}
									showSeconds={showSeconds.value}
									{
										...props.timePickerOptions
									}
									panelDate={dates.value[0]}
									onPick={value => handleTimePick('left', value)}
								/>
							</div>
							<div class="vc-daterange-panel__content is-right">
								<DateHeader
									currentView={rightCurrentView.value}
									panelDate={rightPanelDate.value}
									showNext={props.splitPanels}
									title="结束时间"
									onChange={(panelDate, type) => handlePanelChange(panelDate, type, 'right')}
									// @ts-ignore
									onChangeCurrentView={handleChangeRightCurrentView}
								/>
								{
									rightCurrentView.value === 'daterange' && (
										<DateTable
											value={dates.value}
											panelDate={rightPanelDate.value}
											disabledDate={props.disabledDate}
											focusedDate={props.focusedDate as Date}
											rangeState={rangeState.value}
											onPick={(value, cell) => handlePick(value, cell, 'right')}
											// @ts-ignore
											onRangeChange={handleRangeChange}
										/>
									)
								}
								{
									rightCurrentView.value === 'year' && (
										<YearTable
											value={[dates.value[1]]}
											panelDate={rightPanelDate.value}
											onPick={handleRightYearPick}
										/>
									)
								}
								{
									rightCurrentView.value === 'month' && (
										<MonthTable
											value={[dates.value[1]]}
											panelDate={rightPanelDate.value}
											onPick={handleRightMonthPick}
										/>
									)
								}
								<TimeSelect
									// @ts-ignore
									vShow={rightCurrentView.value === 'timerange'}
									hours={timeSlots.value.right.hours}
									minutes={timeSlots.value.right.minutes}
									seconds={timeSlots.value.right.seconds}
									showSeconds={showSeconds.value}
									{
										...props.timePickerOptions
									}
									panelDate={dates.value[1]}
									onPick={value => handleTimePick('right', value)}
								/>
							</div>
						</div>
						{
							props.confirm && (
								<Confirm
									showTime={canSelectTime.value}
									currentView={[leftCurrentView.value, rightCurrentView.value]}
									// @ts-ignore
									onClear={handleClear}
									onOk={handleOK}
									onToggleTime={handleToggleTime}
								/>
							)
						}
					</div>
				</div>
			);
		};
	}
});
