/** @jsxImportSource vue */

import { defineComponent, ref, computed } from 'vue';
import { getDateOfTime, clearTime } from '../helper/date-utils';
import { props as timeProps } from './base-time-props';
import { Confirm, TimeSelect } from './base';
import { useReady } from './use-ready';

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
		const isReady = useReady();
		const dates = ref(props.value!);

		const showSeconds = computed(() => {
			return !(props.format || '').match(/mm$/);
		});
		const timeSlots = computed(() => {
			const date = dates.value[0];
			if (!date || !isReady.value) return [];
			return [date.getHours(), date.getMinutes(), date.getSeconds()];
		});

		const handlePick = (value: any) => {
			// TODO confirm为false 不能实时响应，但不关闭弹层
			const date = dates.value[0] || clearTime(new Date());
			const newDate = getDateOfTime(date, value);
			dates.value = [newDate];
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
				<div class="vc-time-panel">
					<TimeSelect
						hours={timeSlots.value[0]}
						minutes={timeSlots.value[1]}
						seconds={timeSlots.value[2]}
						showSeconds={showSeconds.value}
						disabledHours={props.disabledHours}
						disabledMinutes={props.disabledMinutes}
						disabledSeconds={props.disabledSeconds}
						hideDisabledOptions={props.hideDisabledOptions}
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
