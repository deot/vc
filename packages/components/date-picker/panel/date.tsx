/** @jsxImportSource vue */

import { defineComponent, ref, computed, watch, toRaw } from 'vue';
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
		// 面板上的值即 props.value（由 picker 写回），面板只保存当前显示的月份
		const getValueDate = (value: Date[]) => {
			const date: any = value[0];
			return (props.type === 'quarter' ? date?.[0] : date) as Date | undefined;
		};
		const panelDate = ref(getValueDate(props.value!) || props.startDate || new Date());

		// 面板最近一次发出的值：写回来时不移动日历（多选时第一项可能不在当前月）
		let emitted: Date[] | undefined;
		const pick = (value: Date[], prevDate?: Date) => {
			emitted = value;
			emit('pick', value, prevDate);
		};

		// 外部改了值（如在输入框里键入）时，日历移到该值所在的月份
		watch(
			() => props.value!,
			(v) => {
				const date = toRaw(v) !== emitted && getValueDate(v);
				date && (panelDate.value = date);
			}
		);
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
			const date = props.value![0];
			if (!date) return [];
			return [date.getHours(), date.getMinutes(), date.getSeconds()];
		});

		const month = computed(() => {
			return panelDate.value.getMonth();
		});
		const year = computed(() => {
			return panelDate.value.getFullYear();
		});

		const handlePick = (value: any, cell: any) => {
			const dates = props.value!;
			if (!props.multiple) {
				const date = dates[0];
				const time = {
					hours: (date || value).getHours(),
					minutes: (date || value).getMinutes(),
					seconds: (date || value).getSeconds(),
				};
				const newDate = getDateOfTime(value, time);
				panelDate.value = newDate;
				pick([newDate]);
			} else {
				panelDate.value = value;
				if (cell.type === 'normal') {
					// 已选中的再点一次取消，并带出被取消的日期
					const prevDate = dates.find(date => date.getTime() === value.getTime());
					pick(prevDate ? dates.filter(date => date !== prevDate) : [...dates, value], prevDate);
				}
			}
		};

		const handleTimePick = (value: any) => {
			const newDate = getDateOfTime(props.value![0] || panelDate.value, value);
			panelDate.value = newDate;
			pick([newDate]);
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
				pick([value]);
			} else {
				const newDate = changeYearMonthAndClampDate(props.value![0] || panelDate.value, value.getFullYear(), month.value);
				panelDate.value = newDate;
				currentView.value = 'month';
			}
		};

		const handleMonthPick = (value: Date) => {
			if (props.type === 'month') {
				pick([value]);
			} else {
				const newDate = changeYearMonthAndClampDate(props.value![0] || panelDate.value, year.value, value.getMonth());
				panelDate.value = newDate;
				currentView.value = 'date';
			}
		};
		// 季度选择value => 月份的范围
		const handleQuarterPick = (value: Date[]) => {
			pick(value);
		};

		const handleToggleTime = (view: string) => {
			currentView.value = view;
		};

		const handleClear = () => {
			emit('clear');
		};

		const handleOK = () => {
			emit('ok', props.value);
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
									value={props.value}
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
									value={props.value}
									panelDate={panelDate.value}
									onPick={handleYearPick}
								/>
							)
						}
						{
							currentView.value === 'month' && (
								<MonthTable
									value={props.value}
									panelDate={panelDate.value}
									disabledDate={props.disabledDate}
									onPick={handleMonthPick}
								/>
							)
						}
						{
							currentView.value === 'quarter' && (
								<QuarterTable
									value={props.value}
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
