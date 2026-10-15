/** @jsxImportSource vue */

import { defineComponent, ref, watch, computed, reactive, onMounted, onBeforeUnmount } from 'vue';
import { preZero } from '@deot/helper-utils';
import { scrollIntoView } from '@deot/helper-dom';
import { Resize } from '@deot/helper-resize';
import { startCase } from 'lodash-es';
import { clearTime, getDateOfTime } from '../../helper/date-utils';
import { Scroller } from '../../../scroller';

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
		const spinerSteps = ref([1, 1, 1].map((one, i) => Math.abs(props.steps[i] as number) || one));
		const focusedColumn = ref(-1);
		const focusedTime = ref([0, 0, 0]); // [hh, mm, ss]
		const refs = reactive({});
		// 各列是 Scroller：记下实例，用到时再取其根节点（滚动容器）；Scroller 刚挂载时它自己的节点引用还没写入
		const setRef = (key: string) => (el: any) => {
			if (el) {
				refs[key] = el;
			}
		};
		const getList = (type: string) => refs[type]?.wrapper as HTMLElement | undefined;

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

		const lists = { hours: hoursList, minutes: minutesList, seconds: secondsList };
		const types = Object.keys(lists);
		// 各列是否可见（有尺寸）：弹层关闭、被 v-show 隐藏（如日期时间面板的日期视图）时为 false
		const visible = { hours: false, minutes: false, seconds: false };

		// 滚到选中项，每行 24px
		const scroll = (type: string, animated: boolean) => {
			const el = getList(type);
			const index = lists[type].value.findIndex((obj: any) => obj.text == props[type]);
			if (!el || index === -1) return;
			scrollIntoView(el, { from: el.scrollTop, to: 24 * getScrollIndex(type, index), duration: animated ? 500 : 0 });
		};

		// 列变为可见时（打开弹层、切到时间视图）直接定位到选中项；可见期间选中项变化（点选、键入）带动画滚过去
		const handleResize = (entries: ResizeObserverEntry[]) => {
			entries.forEach(({ target }) => {
				const type = types.find(key => getList(key) === target);
				if (!type) return;
				const isVisible = (target as HTMLElement).clientHeight > 0;
				isVisible && !visible[type] && scroll(type, false);
				visible[type] = isVisible;
			});
		};
		types.forEach((type) => {
			watch(() => props[type], () => visible[type] && scroll(type, true));
		});
		onMounted(() => {
			types.forEach((type) => {
				const el = getList(type);
				el && Resize.on(el, handleResize, { shared: true });
			});
		});
		onBeforeUnmount(() => Resize.disconnect(handleResize));

		return () => {
			return (
				<div class="vc-time-select">
					<Scroller ref={setRef('hours')} class="vc-time-select__list">
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
					</Scroller>
					<Scroller ref={setRef('minutes')} class="vc-time-select__list">
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
					</Scroller>
					<Scroller
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
					</Scroller>
				</div>
			);
		};
	}
});
