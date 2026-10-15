/** @jsxImportSource vue */

import { useLocale } from '../../locale';
import { defineComponent, computed } from 'vue';
import { getDateOfTime, clearTime } from '../helper/date-utils';
import { props as timeProps } from './base-time-props';
import { Confirm, TimeSelect, DateHeader } from './base';

const getComparedDate = (leftDate: Date, rightDate: Date) => {
	const lhours = leftDate.getHours();
	const lminutes = leftDate.getMinutes();
	const lseconds = leftDate.getSeconds();
	const rhours = rightDate.getHours();
	const rminutes = rightDate.getMinutes();
	const rseconds = rightDate.getSeconds();
	const hours = lhours > rhours ? lhours : rhours;
	const minutes = lminutes > rminutes ? lminutes : rminutes;
	const seconds = lseconds > rseconds ? lseconds : rseconds;
	return { hours, minutes, seconds };
};

const COMPONENT_NAME = 'vc-timerange-panel';

export const TimeRangePanel = defineComponent({
	name: COMPONENT_NAME,
	props: timeProps,
	emits: [
		'pick',
		'clear',
		'ok'
	],
	setup(props, { emit }) {
		const { t } = useLocale();
		const showSeconds = computed(() => {
			return !(props.format || '').match(/mm$/);
		});
		// 面板上的值即 props.value（由 picker 写回）
		const timeSlots = computed(() => {
			const [leftDate, rightDate] = props.value!;
			if (!leftDate || !rightDate) {
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

		const handlePick = (type: string, value: any) => {
			let leftNewDate = props.value![0] || clearTime(new Date());
			let rightNewDate = props.value![1] || clearTime(new Date());
			type === 'left' && (leftNewDate = getDateOfTime(leftNewDate, value));
			type === 'right' && (rightNewDate = getDateOfTime(rightNewDate, value));
			if (leftNewDate > rightNewDate) {
				rightNewDate = getDateOfTime(rightNewDate, getComparedDate(leftNewDate, rightNewDate));
			}
			emit('pick', [leftNewDate, rightNewDate]);
		};

		const handleClear = () => {
			emit('clear');
		};

		const handleOK = () => {
			emit('ok', props.value);
		};

		return () => {
			return (
				<div class="vc-timerange-panel">
					<div class="vc-timerange-panel__wrapper">
						<div class="vc-timerange-panel__content is-left">
							<DateHeader
								currentView="timerange"
								title={t('vc.DatePicker.startTime')}
							/>
							<TimeSelect
								hours={timeSlots.value.left.hours}
								minutes={timeSlots.value.left.minutes}
								seconds={timeSlots.value.left.seconds}
								showSeconds={showSeconds.value}
								disabledTime={props.disabledTime}
								disabledHours={props.disabledHours}
								disabledMinutes={props.disabledMinutes}
								disabledSeconds={props.disabledSeconds}
								filterable={props.filterable}
								steps={props.steps}
								onPick={value => handlePick('left', value)}
							/>
						</div>
						<div class="vc-timerange-panel__content is-right">
							<DateHeader
								currentView="timerange"
								title={t('vc.DatePicker.endTime')}
							/>
							<TimeSelect
								hours={timeSlots.value.right.hours}
								minutes={timeSlots.value.right.minutes}
								seconds={timeSlots.value.right.seconds}
								showSeconds={showSeconds.value}
								disabledTime={props.disabledTime}
								disabledHours={props.disabledHours}
								disabledMinutes={props.disabledMinutes}
								disabledSeconds={props.disabledSeconds}
								filterable={props.filterable}
								steps={props.steps}
								onPick={value => handlePick('right', value)}
							/>
						</div>
					</div>
					{
						props.confirm && (
							<Confirm
								showTime={false}
								currentView="timerange"
								// @ts-ignore
								onClear={handleClear}
								onOk={handleOK}
							/>
						)
					}
				</div>
			);
		};
	}
});
