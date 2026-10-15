/** @jsxImportSource vue */

import { defineComponent, computed } from 'vue';
import { getDateOfTime, clearTime } from '../helper/date-utils';
import { props as timeProps } from './base-time-props';
import { Confirm, TimeSelect } from './base';

const COMPONENT_NAME = 'vc-time-panel';

export const TimePanel = defineComponent({
	name: COMPONENT_NAME,
	props: timeProps,
	emits: [
		'pick',
		'clear',
		'ok'
	],
	setup(props, { emit }) {
		const showSeconds = computed(() => {
			return !(props.format || '').match(/mm$/);
		});
		// 面板上的值即 props.value（由 picker 写回）
		const timeSlots = computed(() => {
			const date = props.value![0];
			if (!date) return [];
			return [date.getHours(), date.getMinutes(), date.getSeconds()];
		});

		const handlePick = (value: any) => {
			// TODO confirm为false 不能实时响应，但不关闭弹层
			const date = props.value![0] || clearTime(new Date());
			emit('pick', [getDateOfTime(date, value)]);
		};

		const handleClear = () => {
			emit('clear');
		};

		const handleOK = () => {
			emit('ok', props.value);
		};

		return () => {
			return (
				<div class="vc-time-panel">
					<TimeSelect
						hours={timeSlots.value[0]}
						minutes={timeSlots.value[1]}
						seconds={timeSlots.value[2]}
						showSeconds={showSeconds.value}
						disabledTime={props.disabledTime}
						disabledHours={props.disabledHours}
						disabledMinutes={props.disabledMinutes}
						disabledSeconds={props.disabledSeconds}
						filterable={props.filterable}
						steps={props.steps}
						onPick={handlePick}
					/>
					{
						props.confirm && (
							<Confirm
								showTime={false}
								currentView="time"
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
