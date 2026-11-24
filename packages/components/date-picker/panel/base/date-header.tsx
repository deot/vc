/** @jsxImportSource vue */

import { defineComponent, computed, Fragment } from 'vue';
import { preZero } from '@deot/helper-utils';
import { dayjs } from '../../helper/dayjs';
import { useLocale } from '../../../locale';
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
		const { t } = useLocale();
		const year = computed(() => {
			return t('vc.DatePicker.year', { value: props.panelDate!.getFullYear() });
		});
		const month = computed(() => {
			const $month = props.panelDate!.getMonth() + 1;
			return t('vc.DatePicker.month', { value: preZero($month) });
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

		// 翻页：年视图一次翻 10 年
		const handleShift = (direction: 'prev' | 'next', unit: 'month' | 'year') => () => {
			const amount = (unit === 'year' && props.currentView === 'year' ? 10 : 1) * (direction === 'prev' ? -1 : 1);
			emit('change', dayjs(props.panelDate!).add(amount, unit).toDate(), `${direction}-${unit}`);
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
													onClick={handleShift('prev', 'year')}
												/>
											)
										}
										{
											props.showPrev && isDate.value && (
												<Icon
													class="vc-date-header__arrow is-prev"
													type="arrow-left"
													// @ts-ignore
													onClick={handleShift('prev', 'month')}
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
													onClick={handleShift('next', 'year')}
												/>
											)
										}
										{
											props.showNext && isDate.value && (
												<Icon
													class="vc-date-header__arrow is-next"
													type="arrow-right"
													// @ts-ignore
													onClick={handleShift('next', 'month')}
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
