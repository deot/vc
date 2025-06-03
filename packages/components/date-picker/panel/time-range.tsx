/** @jsxImportSource vue */

import { defineComponent, ref, computed } from 'vue';
import { getDateOfTime, clearTime } from '../helper/date-utils';
import { props as timeProps } from './base-time-props';
import { Confirm, TimeSelect, DateHeader } from './base';
import { useReady } from './use-ready';

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
		const isReady = useReady();
		const dates = ref(props.value!);
		const showSeconds = computed(() => {
			return !(props.format || '').match(/mm$/);
		});
		const timeSlots = computed(() => {
			const leftDate = dates.value[0];
			const rightDate = dates.value[1];
			if (!leftDate || !rightDate || !isReady.value) {
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
			let leftNewDate = dates.value[0] || clearTime(new Date());
			let rightNewDate = dates.value[1] || clearTime(new Date());
			type === 'left' && (leftNewDate = getDateOfTime(leftNewDate, value));
			type === 'right' && (rightNewDate = getDateOfTime(rightNewDate, value));
			if (leftNewDate > rightNewDate) {
				rightNewDate = getDateOfTime(rightNewDate, getComparedDate(leftNewDate, rightNewDate));
			}
			dates.value = [leftNewDate, rightNewDate];
			emit('pick', dates.value);
		};

		const handleClear = () => {
			emit('clear');
		};

		const handleOK = () => {
			emit('ok', dates.value);
		};

		return () => {
			return (
				<div class="vc-timerange-panel">
					<div class="vc-timerange-panel__wrapper">
						<div class="vc-timerange-panel__content is-left">
							<DateHeader
								currentView="timerange"
								title="开始时间"
							/>
							<TimeSelect
								hours={timeSlots.value.left.hours}
								minutes={timeSlots.value.left.minutes}
								seconds={timeSlots.value.left.seconds}
								showSeconds={showSeconds.value}
								disabledHours={props.disabledHours}
								disabledMinutes={props.disabledMinutes}
								disabledSeconds={props.disabledSeconds}
								hideDisabledOptions={props.hideDisabledOptions}
								steps={props.steps}
								onPick={value => handlePick('left', value)}
							/>
						</div>
						<div class="vc-timerange-panel__content is-right">
							<DateHeader
								currentView="timerange"
								title="结束时间"
							/>
							<TimeSelect
								hours={timeSlots.value.right.hours}
								minutes={timeSlots.value.right.minutes}
								seconds={timeSlots.value.right.seconds}
								showSeconds={showSeconds.value}
								disabledHours={props.disabledHours}
								disabledMinutes={props.disabledMinutes}
								disabledSeconds={props.disabledSeconds}
								hideDisabledOptions={props.hideDisabledOptions}
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
