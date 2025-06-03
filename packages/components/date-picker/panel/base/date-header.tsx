/** @jsxImportSource vue */

import { defineComponent, computed, Fragment } from 'vue';
import { preZero } from '@deot/helper-utils';
import { prevYear, nextYear, prevMonth, nextMonth } from '../../helper/date-utils';
import { Icon } from '../../../icon/index';

const COMPONENT_NAME = 'vc-date-header';

export const DateHeader = defineComponent({
	name: COMPONENT_NAME,
	props: {
		panelDate: Date,
		showNext: {
			type: Boolean,
			default: true
		},
		showPrev: {
			type: Boolean,
			default: true
		},
		currentView: String,
		title: String
	},
	emits: [
		'change-current-view',
		'change'
	],
	setup(props, { emit }) {
		const year = computed(() => {
			return props.panelDate!.getFullYear() + '年';
		});
		const month = computed(() => {
			const $month = props.panelDate!.getMonth() + 1;
			return preZero($month) + '月';
		});
		const isDate = computed(() => {
			return ['date', 'daterange'].includes(props.currentView!);
		});

		const handleShowYearPicker = () => {
			emit('change-current-view', 'year');
		};

		const handleShowMonthPicker = () => {
			emit('change-current-view', 'month');
		};

		const handlePrevMonth = () => {
			const prevM = prevMonth(props.panelDate!);
			emit('change', prevM, 'prev-month');
		};

		const handlePrevYear = () => {
			const amount = props.currentView === 'year' ? 10 : 1;
			const prevY = prevYear(props.panelDate!, amount);
			emit('change', prevY, 'prev-year');
		};

		const handleNextMonth = () => {
			const nextM = nextMonth(props.panelDate!);
			emit('change', nextM, 'next-month');
		};

		const handleNextYear = () => {
			const amount = props.currentView === 'year' ? 10 : 1;
			const nextY = nextYear(props.panelDate!, amount);
			emit('change', nextY, 'next-year');
		};

		return () => {
			return (
				<div class="vc-date-header">
					{
						props.currentView !== 'timerange'
							? (
									<Fragment>
										{
											props.showPrev && (
												<Icon
													class="vc-date-header__arrow is-prev is-prev-year"
													type="d-arrow-left"
													// @ts-ignore
													onClick={handlePrevYear}
												/>
											)
										}
										{
											props.showPrev && isDate.value && (
												<Icon
													class="vc-date-header__arrow is-prev"
													type="arrow-left"
													// @ts-ignore
													onClick={handlePrevMonth}
												/>
											)
										}
										<span class="vc-date-header__label" onClick={handleShowYearPicker}>{year.value}</span>
										{
											isDate.value && (
												<span class="vc-date-header__label" onClick={handleShowMonthPicker}>{month.value}</span>
											)
										}
										{
											props.showNext && (
												<Icon
													class="vc-date-header__arrow is-next is-next-year"
													type="d-arrow-right"
													// @ts-ignore
													onClick={handleNextYear}
												/>
											)
										}
										{
											props.showNext && isDate.value && (
												<Icon
													class="vc-date-header__arrow is-next"
													type="arrow-right"
													// @ts-ignore
													onClick={handleNextMonth}
												/>
											)
										}
									</Fragment>
								)
							: <span>{ props.title }</span>
					}
				</div>
			);
		};
	}
});
