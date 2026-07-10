/** @jsxImportSource vue */

import { computed, defineComponent, ref, Transition } from 'vue';
import { props as calendarProps } from './calendar-props';
import date2holiday from './date2holiday';
import { formatDate, getMonthData, sortWeekNames } from './utils';
import type { CalendarAdjacentWeeks, CalendarCell } from './types';

const COMPONENT_NAME = 'vc-calendar';

const normalizeShowAdjacentWeeks = (value: CalendarAdjacentWeeks): [boolean, boolean] => {
	return Array.isArray(value)
		? value
		: [value, value];
};

export const Calendar = defineComponent({
	name: COMPONENT_NAME,
	props: calendarProps,
	setup(props, { expose, slots }) {
		const now = new Date();
		const currentTarget = ref(now);
		const currentMonth = ref(now.getMonth());
		const currentYear = ref(now.getFullYear());
		const slideMode = ref('left');

		const monthData = computed(() => {
			return getMonthData(currentYear.value, currentMonth.value + 1, props.firstDayOfWeek);
		});

		const calendarRows = computed(() => {
			const rows = Array.from({ length: 6 }, (_, rowIndex) => {
				return monthData.value.data.slice(rowIndex * 7, rowIndex * 7 + 7);
			});
			const [showPrev, showNext] = normalizeShowAdjacentWeeks(props.showAdjacentWeeks);

			return rows.filter((row) => {
				if (row.every(cell => cell.type === 'prev')) {
					return showPrev;
				}

				if (row.every(cell => cell.type === 'next')) {
					return showNext;
				}

				return true;
			});
		});

		const today = computed(() => {
			return formatDate(currentTarget.value);
		});

		const monthSlotData = computed(() => {
			return {
				month: props.monthNames[currentMonth.value]?.[props.lang],
				year: currentYear.value
			};
		});

		const weekSlotData = computed(() => {
			return sortWeekNames(props.weekNames, props.firstDayOfWeek);
		});

		const next = () => {
			slideMode.value = 'left';

			if (currentMonth.value === 11) {
				currentMonth.value = 0;
				currentYear.value++;
			} else {
				currentMonth.value++;
			}
		};

		const prev = () => {
			slideMode.value = 'right';

			if (currentMonth.value === 0) {
				currentMonth.value = 11;
				currentYear.value--;
			} else {
				currentMonth.value--;
			}
		};

		expose({
			prev,
			next
		});

		const renderMonth = () => {
			const slotProps = {
				data: monthSlotData.value,
				month: currentMonth.value,
				year: currentYear.value,
				lang: props.lang,
				monthNames: props.monthNames
			};

			return slots.month
				? slots.month(slotProps)
				: props.renderMonth(slotProps);
		};

		const renderWeek = () => {
			const slotProps = {
				data: weekSlotData.value.map(item => item[props.lang]),
				date: weekSlotData.value.map(item => item[props.lang]),
				weekNames: weekSlotData.value,
				lang: props.lang,
				firstDayOfWeek: props.firstDayOfWeek
			};

			return slots.week
				? slots.week(slotProps)
				: props.renderWeek(slotProps);
		};

		const renderDate = (cell: CalendarCell, index: number) => {
			const holiday = date2holiday(cell.value);
			const slotProps = {
				cell,
				today: today.value,
				holiday
			};

			return (
				<span
					key={`${cell.value}-${index}`}
					class={['vc-calendar-row__item', `is-${cell.type}`]}
				>
					{
						slots.default
							? slots.default(slotProps)
							: props.renderDate(slotProps)
					}
				</span>
			);
		};

		return () => {
			return (
				<div class="vc-calendar">
					{ renderMonth() }
					<div class="vc-calendar__content">
						{ renderWeek() }
						<div class="vc-calendar__body">
							<Transition name={`vc-calendar__${slideMode.value}`}>
								<div key={`${currentYear.value}-${currentMonth.value}`} class="vc-calendar__dates">
									{
										calendarRows.value.map((row, rowIndex) => {
											return (
												<div key={row.map(cell => cell.value).join('-')} class="vc-calendar-row">
													{
														row.map((cell, columnIndex) => {
															return renderDate(cell, rowIndex * 7 + columnIndex);
														})
													}
												</div>
											);
										})
									}
								</div>
							</Transition>
						</div>
					</div>
				</div>
			);
		};
	}
});
