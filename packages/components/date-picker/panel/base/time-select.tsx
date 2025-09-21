/** @jsxImportSource vue */

import { defineComponent, ref, watch, computed, reactive } from 'vue';
import { preZero } from '@deot/helper-utils';
import { scrollIntoView } from '@deot/helper-dom';
import { startCase } from 'lodash-es';
import { clearTime, getDateOfTime } from '../../helper/date-utils';

const COMPONENT_NAME = 'vc-time-select';

export const TimeSelect = defineComponent({
	name: COMPONENT_NAME,
	props: {
		hours: {
			type: [Number, String],
			default: NaN
		},
		minutes: {
			type: [Number, String],
			default: NaN
		},
		seconds: {
			type: [Number, String],
			default: NaN
		},
		showSeconds: {
			type: Boolean,
			default: true
		},
		steps: {
			type: Array,
			default: () => []
		},
		disabledHours: {
			type: Array,
			default() {
				return [];
			}
		},
		disabledMinutes: {
			type: Array,
			default() {
				return [];
			}
		},
		disabledSeconds: {
			type: Array,
			default() {
				return [];
			}
		},
		disabledTime: Function,
		panelDate: Date,

		// 默认不过来disabled数值
		filterable: {
			type: Boolean,
			default: false
		}
	},
	emits: [
		'pick'
	],
	setup(props, { emit }) {
		const isTouch = ref('ontouchend' in window);
		const spinerSteps = ref([1, 1, 1].map((one, i) => Math.abs(props.steps[i] as number) || one));
		const compiled = ref(false);
		const isFirst = ref(false);
		const focusedColumn = ref(-1);
		const focusedTime = ref([0, 0, 0]); // [hh, mm, ss]
		const refs = reactive({});
		const setRef = (key: string) => (el: any) => {
			if (el) {
				refs[key] = el;
			}
		};

		const getHoursDisabledStatus = (hours: number) => {
			if (typeof props.disabledTime !== 'function') return;
			const date = new Date(props.panelDate!);
			const panelDate = clearTime(date);
			const startTime = { hours, minutes: 0, seconds: 0 };
			const endTime = { hours, minutes: 59, seconds: 59 };
			const startDate = getDateOfTime(panelDate, startTime);
			const endDate = getDateOfTime(panelDate, endTime);
			return props.disabledTime(startDate) && props.disabledTime(endDate);
		};

		const getMinutesDisabledStatus = (minutes: number) => {
			if (typeof props.disabledTime !== 'function') return;
			const date = new Date(props.panelDate!);
			const panelDate = clearTime(date);
			const startTime = { hours: date.getHours(), minutes, seconds: 0 };
			const endTime = { hours: date.getHours(), minutes, seconds: 59 };
			const startDate = getDateOfTime(panelDate, startTime);
			const endDate = getDateOfTime(panelDate, endTime);
			return props.disabledTime(startDate) && props.disabledTime(endDate);
		};

		const getSecondsDisabledStatus = (seconds: number) => {
			if (typeof props.disabledTime !== 'function') return;
			const date = new Date(props.panelDate!);
			const panelDate = clearTime(date);
			const startTime = { hours: date.getHours(), minutes: date.getMinutes(), seconds };
			const startDate = getDateOfTime(panelDate, startTime);
			return props.disabledTime(startDate);
		};

		const handleClick = (type: string, cell: any) => {
			if (cell.disabled) return;
			const data = { [type]: cell.text };
			isFirst.value = false;
			emit('pick', data);
		};

		const getCellClasses = (cell: any) => {
			const classes: string[] = [];

			if (cell.selected) classes.push('is-selected');
			if (cell.disabled) { classes.push('is-disabled'); }
			if (cell.focused) { classes.push('is-focused'); }

			// TODO 其他情况的样式
			return classes.join(' ');
		};

		const getScrollIndex = (type: string, index: number) => {
			const Type = startCase(type);
			const disabled = props[`disabled${Type}`];
			if (disabled.length && props.filterable) {
				let _count = 0;
				disabled.forEach((item: any) => (item <= index ? _count++ : ''));
				index -= _count;
			}
			return index;
		};

		const scroll = (type: string, index: number) => {
			const from = refs[type].scrollTop;
			const to = 24 * getScrollIndex(type, index);
			scrollIntoView(refs[type], {
				from,
				to,
				duration: isFirst.value ? 0 : 500, // 首次展示时不执行滚动动画
			});
		};

		const hoursList = computed(() => {
			const hours: any[] = [];
			const step = spinerSteps.value[0];
			const focusedHour = focusedColumn.value === 0 && focusedTime.value[0];
			const hourTmpl = {
				text: 0,
				selected: false,
				disabled: false,
				hide: false
			};
			for (let i = 0; i < 24; i += step) {
				const hour: any = { ...hourTmpl };
				hour.text = i;
				hour.focused = i === focusedHour;
				if (
					(props.disabledHours.length && props.disabledHours.includes(i))
					|| getHoursDisabledStatus(i)
				) {
					hour.disabled = true;
					if (props.filterable) hour.hide = true;
				}
				if (props.hours === i) hour.selected = true;
				hours.push(hour);
			}
			return hours;
		});

		const minutesList = computed(() => {
			const minutes: any[] = [];
			const step = spinerSteps.value[1];
			const focusedMinute = focusedColumn.value === 1 && focusedTime.value[1];
			const minuteTmpl = {
				text: 0,
				selected: false,
				disabled: false,
				hide: false
			};
			for (let i = 0; i < 60; i += step) {
				const minute: any = { ...minuteTmpl };
				minute.text = i;
				minute.focused = i === focusedMinute;
				if (
					(props.disabledMinutes.length && props.disabledMinutes.includes(i))
					|| getMinutesDisabledStatus(i)
				) {
					minute.disabled = true;
					if (props.filterable) minute.hide = true;
				}
				if (props.minutes === i) minute.selected = true;
				minutes.push(minute);
			}
			return minutes;
		});

		const secondsList = computed(() => {
			const seconds: any[] = [];
			const step = spinerSteps.value[2];
			const focusedMinute = focusedColumn.value === 2 && focusedTime.value[2];
			const secondTmpl = {
				text: 0,
				selected: false,
				disabled: false,
				hide: false
			};
			for (let i = 0; i < 60; i += step) {
				const second: any = { ...secondTmpl };
				second.text = i;
				second.focused = i === focusedMinute;
				if (
					(props.disabledSeconds.length && props.disabledSeconds.includes(i))
					|| getSecondsDisabledStatus(i)
				) {
					second.disabled = true;
					if (props.filterable) second.hide = true;
				}
				if (props.seconds === i) second.selected = true;
				seconds.push(second);
			}
			return seconds;
		});

		[
			['hours', hoursList],
			['minutes', minutesList],
			['seconds', secondsList]
		].forEach((item) => {
			watch(
				() => props[item[0] as string],
				(v) => {
					if (!compiled.value) return;
					scroll(item[0] as string, (item[1] as any).value.findIndex((obj: any) => { return obj.text == v; }));
				}
			);
		});

		return () => {
			return (
				<div class={[{ 'is-touch': isTouch.value }, 'vc-time-select']}>
					<div ref={setRef('hours')} class="vc-time-select__list">
						<ul class="vc-time-select__ul">
							{
								hoursList.value.map((item: any, index: number) => {
									return (
										<li
											// @ts-ignore
											vShow={!item.hide}
											key={index}
											class={[getCellClasses(item), 'vc-time-select__li']}
											onClick={() => handleClick('hours', item)}
										>
											{ preZero(item.text) }
										</li>
									);
								})
							}
						</ul>
					</div>
					<div ref={setRef('minutes')} class="vc-time-select__list">
						<ul class="vc-time-select__ul">
							{
								minutesList.value.map((item: any, index: number) => {
									return (
										<li
											// @ts-ignore
											vShow={!item.hide}
											key={index}
											class={[getCellClasses(item), 'vc-time-select__li']}
											onClick={() => handleClick('minutes', item)}
										>
											{ preZero(item.text) }
										</li>
									);
								})
							}
						</ul>
					</div>
					<div
						// @ts-ignore
						vShow={props.showSeconds}
						ref={setRef('seconds')}
						class="vc-time-select__list"
					>
						<ul class="vc-time-select__ul">
							{
								secondsList.value.map((item: any, index: number) => {
									return (
										<li
											// @ts-ignore
											vShow={!item.hide}
											key={index}
											class={[getCellClasses(item), 'vc-time-select__li']}
											onClick={() => handleClick('seconds', item)}
										>
											{ preZero(item.text) }
										</li>
									);
								})
							}
						</ul>
					</div>
				</div>
			);
		};
	}
});
