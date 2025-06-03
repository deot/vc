/** @jsxImportSource vue */

import { defineComponent, ref, computed } from 'vue';
import { props as dateProps } from './base-date-props';
import { YearTable, MonthTable, DateTable, DateHeader, Confirm, TimeSelect, ShortcutsSelect, QuarterTable } from './base';
import { getDateOfTime, changeYearMonthAndClampDate } from '../helper/date-utils';

const COMPONENT_NAME = 'vc-date-panel';

export const DatePanel = defineComponent({
	name: COMPONENT_NAME,
	props: {
		...dateProps,
		type: String,
		confirm: {
			type: Boolean,
			default: false
		},
		// 在type === 'date' 下才有效
		multiple: {
			type: Boolean,
			default: false
		}
	},
	emits: [
		'pick',
		'clear',
		'ok'
	],
	setup(props, { emit }) {
		const dates = ref(props.value!);
		const panelDate = ref((() => {
			let value = props.value![0];
			if (props.type === 'quarter' && value) {
				value = value[0];
			}
			return value || props.startDate || new Date();
		})());
		const currentView = ref((() => {
			if (props.type === 'year') {
				return 'year';
			} else if (props.type === 'month') {
				return 'month';
			} else if (props.type === 'quarter') {
				return 'quarter';
			}
			return 'date';
		})());

		const showSeconds = computed(() => {
			return !(props.format || '').match(/mm$/);
		});

		const timeSlots = computed(() => {
			/**
			 * currentView.value !== 'time' 由于time-select是用v-show控制显示隐藏，
			 * 所以在面板为time时，才去更改timeSlots, time-select才会触发watch
			 */
			const date = dates.value[0];
			if (!date || currentView.value !== 'time') return [];
			return [date.getHours(), date.getMinutes(), date.getSeconds()];
		});

		const month = computed(() => {
			return panelDate.value.getMonth();
		});
		const year = computed(() => {
			return panelDate.value.getFullYear();
		});

		const handlePick = (value: any, cell: any) => {
			if (!props.multiple) {
				const date = dates.value[0];
				const time = {
					hours: (date || value).getHours(),
					minutes: (date || value).getMinutes(),
					seconds: (date || value).getSeconds(),
				};
				const newDate = getDateOfTime(value, time);
				panelDate.value = newDate;
				dates.value = [newDate];
				emit('pick', dates.value);
			} else {
				const index = dates.value.findIndex(date => date.getTime() === value.getTime());
				panelDate.value = value;
				if (cell.type === 'normal') {
					let prevDate: Date[] = []; // 不要的date
					index > -1 ? (prevDate = dates.value.splice(index, 1)) : (dates.value = [...dates.value, value]);
					emit('pick', dates.value, prevDate[0]);
				}
			}
		};

		const handleTimePick = (value: any) => {
			const newDate = getDateOfTime(dates.value[0] || panelDate.value, value);
			panelDate.value = newDate;
			dates.value = [newDate];
			emit('pick', dates.value);
		};

		const handleChangeCurrentView = ($currentView: string) => {
			if (currentView.value === $currentView) {
				currentView.value = 'date';
			} else {
				currentView.value = $currentView;
			}
		};

		const handleYearPick = (value: Date) => {
			if (props.type === 'year') {
				const newYear = [value];
				dates.value = newYear;
				emit('pick', newYear);
			} else {
				const newDate = changeYearMonthAndClampDate(dates.value[0] || panelDate.value, value.getFullYear(), month.value);
				panelDate.value = newDate;
				currentView.value = 'month';
			}
		};

		const handleMonthPick = (value: Date) => {
			if (props.type === 'month') {
				const newMonth = [value];
				dates.value = newMonth;
				emit('pick', newMonth);
			} else {
				const newDate = changeYearMonthAndClampDate(dates.value[0] || panelDate.value, year.value, value.getMonth());
				panelDate.value = newDate;
				currentView.value = 'date';
			}
		};
		// 季度选择value => 月份的范围
		const handleQuarterPick = (value: Date[]) => {
			const newQuarter = value;
			dates.value = newQuarter;
			emit('pick', newQuarter);
		};

		const handleToggleTime = (view: string) => {
			currentView.value = view;
		};

		const handleClear = () => {
			emit('clear');
		};

		const handleOK = () => {
			emit('ok', dates.value);
		};

		const handleShortcutPick = (date: Date[]) => {
			// 判断时候在禁用
			const type = props.disabledDate(date) ? 'disabled' : 'normal';
			if (type === 'disabled') {
				return;
			}
			if (currentView.value === 'quarter') {
				panelDate.value = date[0];
				handleQuarterPick(date);
			} else {
				handlePick(date, { type });
			}
		};

		return () => {
			return (
				<div class="vc-date-panel">
					{
						props.shortcuts && props.shortcuts.length > 0 && (
							<div style="width: 100px">
								<ShortcutsSelect
									panelDate={panelDate.value}
									config={props.shortcuts}
									onPick={handleShortcutPick}
								/>
							</div>
						)
					}
					<div class={[{ 'is-with-seconds': showSeconds.value }, 'vc-date-panel__body']}>
						{
							currentView.value !== 'time' && (
								<DateHeader
									currentView={currentView.value}
									panelDate={panelDate.value}
									onChange={v => panelDate.value = v}
									// @ts-ignore
									onChangeCurrentView={handleChangeCurrentView}
								/>
							)
						}
						{
							currentView.value === 'date' && (
								<DateTable
									value={dates.value}
									panelDate={panelDate.value}
									disabledDate={props.disabledDate}
									focusedDate={props.focusedDate as Date}
									onPick={handlePick}
								/>
							)
						}
						{
							currentView.value === 'year' && (
								<YearTable
									value={dates.value}
									panelDate={panelDate.value}
									onPick={handleYearPick}
								/>
							)
						}
						{
							currentView.value === 'month' && (
								<MonthTable
									value={dates.value}
									panelDate={panelDate.value}
									disabledDate={props.disabledDate}
									onPick={handleMonthPick}
								/>
							)
						}
						{
							currentView.value === 'quarter' && (
								<QuarterTable
									value={dates.value}
									panelDate={panelDate.value}
									disabledDate={props.disabledDate}
									onPick={handleQuarterPick}
								/>
							)
						}
						<TimeSelect
							// @ts-ignore
							vShow={currentView.value === 'time'}
							hours={timeSlots.value[0]}
							minutes={timeSlots.value[1]}
							seconds={timeSlots.value[2]}
							showSeconds={showSeconds.value}
							{
								...props.timePickerOptions
							}
							panelDate={panelDate.value}
							onPick={handleTimePick}
						/>
						{
							props.confirm && (
								<Confirm
									showTime={props.showTime && !props.multiple}
									currentView={currentView.value}
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
