/** @jsxImportSource vue */

import { computed, ref, Transition, watch } from 'vue';
import type { SetupContext } from 'vue';
import { useDrag } from '@deot/vc-hooks';
import { Icon } from '../icon';
import { useLocale } from '../locale';
import type { Button } from '../button';
import type { Scroller } from '../scroller';
import { CalendarMonth } from './calendar-month';
import { monthLocaleKeys } from './constants';
import { useCalendarSelection } from './use-calendar-selection';
import type { Props } from './calendar-props';
import type { CalendarMode } from './types';

type Emits = ['update:modelValue', 'update:panelDate', 'update:mode', 'change', 'date-click'];

// 横向滑动超过该距离（px）且明显大于纵向时翻页
const SWIPE_DISTANCE = 40;

const MONTHS = Array.from({ length: 12 }, (_, index) => index);

const toMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

/**
 * Calendar 与 MCalendar 共用：月 / 年视图、头部导航、选择
 * @param props ~
 * @param context ~
 * @param options ~
 * @param options.mobile 移动端：根节点加 vcm-calendar，左右滑动翻页
 * @param options.Button 头部「今天」使用的按钮（Button / MButton）
 * @param options.Scroller 日期内容区的滚动容器（Scroller / MScroller）
 * @returns ~
 */
export const useCalendar = (
	props: Props,
	context: SetupContext<Emits>,
	options: { mobile?: boolean; Button: typeof Button; Scroller: typeof Scroller }
) => {
	const { emit, expose, slots } = context;
	const { mobile = false, Button: ButtonComponent } = options;
	const { t } = useLocale();

	// 切到点中日期所在的月份（点到相邻月的日期时）
	const handlePick = (date: Date) => {
		if (date.getFullYear() !== panelDate.value.getFullYear() || date.getMonth() !== panelDate.value.getMonth()) {
			setPanelDate(toMonth(date), date > panelDate.value ? 'left' : 'right');
		}
	};

	const selection = useCalendarSelection(props, {
		slots,
		emit,
		Scroller: options.Scroller,
		hoverable: !mobile,
		isReadonly: () => props.readonly,
		onPick: handlePick
	});
	const { yearRange } = selection;

	const panelDate = ref(toMonth(props.panelDate || selection.dates.value[0] || new Date()));
	const currentMode = ref<CalendarMode>(props.mode);
	// 翻页过渡的方向；切换年 / 月视图时淡入淡出
	const slideMode = ref<'left' | 'right' | 'fade'>('left');

	watch(
		() => props.panelDate,
		(v) => {
			v && (panelDate.value = toMonth(v));
		}
	);

	watch(
		() => props.mode,
		(v) => {
			currentMode.value = v;
		}
	);

	const year = computed(() => panelDate.value.getFullYear());
	const month = computed(() => panelDate.value.getMonth());

	const clamp = (date: Date) => {
		const [min, max] = yearRange.value;
		if (date.getFullYear() < min) return new Date(min, 0, 1);
		if (date.getFullYear() > max) return new Date(max, 11, 1);
		return date;
	};

	const setPanelDate = (date: Date, direction?: 'left' | 'right') => {
		const next = clamp(date);
		if (next.getTime() === panelDate.value.getTime()) return;

		slideMode.value = direction || (next > panelDate.value ? 'left' : 'right');
		panelDate.value = next;
		emit('update:panelDate', next);
	};

	const setMode = (mode: CalendarMode) => {
		if (mode === currentMode.value) return;

		slideMode.value = 'fade';
		currentMode.value = mode;
		emit('update:mode', mode);
	};

	const isYear = computed(() => currentMode.value === 'year');

	const canPrevious = computed(() => {
		return isYear.value
			? year.value > yearRange.value[0]
			: year.value > yearRange.value[0] || month.value > 0;
	});

	const canNext = computed(() => {
		return isYear.value
			? year.value < yearRange.value[1]
			: year.value < yearRange.value[1] || month.value < 11;
	});

	const previous = () => {
		if (!canPrevious.value) return;
		setPanelDate(new Date(year.value - (isYear.value ? 1 : 0), month.value - (isYear.value ? 0 : 1), 1), 'right');
	};

	const next = () => {
		if (!canNext.value) return;
		setPanelDate(new Date(year.value + (isYear.value ? 1 : 0), month.value + (isYear.value ? 0 : 1), 1), 'left');
	};

	const today = () => setPanelDate(toMonth(new Date()));

	const toggleMode = () => setMode(isYear.value ? 'month' : 'year');

	const getMonthName = (value: number) => t(monthLocaleKeys[value]);

	const title = computed(() => {
		return isYear.value
			? t('vc.DatePicker.year', { value: year.value })
			: t('vc.Calendar.yearMonth', { year: year.value, month: getMonthName(month.value), number: month.value + 1 });
	});

	const adjacentWeeks = computed<[boolean, boolean]>(() => {
		const value = props.showAdjacentWeeks;
		return Array.isArray(value) ? value : [value, value];
	});

	// 左右滑动翻页（移动端）
	let start: { x: number; y: number } | null = null;
	const drag = useDrag({
		start: (_, point) => {
			start = { x: point.clientX, y: point.clientY };
		},
		end: (_, point) => {
			if (!start) return;
			const dx = point.clientX - start.x;
			const dy = point.clientY - start.y;
			start = null;
			if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return;
			dx < 0 ? next() : previous();
		},
		cancel: () => {
			start = null;
		}
	});

	expose({
		previous,
		next
	});

	const renderArrow = (type: 'previous' | 'next') => {
		const enabled = type === 'previous' ? canPrevious.value : canNext.value;
		return (
			<span
				class={['vc-calendar__arrow', `is-${type}`, { 'is-disabled': !enabled }]}
				role="button"
				tabindex={enabled ? 0 : -1}
				aria-disabled={!enabled}
				onClick={type === 'previous' ? previous : next}
				onKeydown={(e: KeyboardEvent) => e.key === 'Enter' && (type === 'previous' ? previous() : next())}
			>
				<Icon type={type === 'previous' ? 'arrow-left' : 'arrow-right'} />
			</span>
		);
	};

	const renderHeader = () => {
		if (slots.header) {
			return slots.header({
				year: year.value,
				month: month.value,
				mode: currentMode.value,
				title: title.value,
				previous,
				next,
				today,
				setMode
			});
		}

		return (
			<div class="vc-calendar__header">
				<div class="vc-calendar__nav">
					{ renderArrow('previous') }
					<span
						class="vc-calendar__title"
						role="button"
						tabindex={0}
						onClick={toggleMode}
						onKeydown={(e: KeyboardEvent) => e.key === 'Enter' && toggleMode()}
					>
						{ title.value }
					</span>
					{ renderArrow('next') }
				</div>
				<ButtonComponent class="vc-calendar__today" size="small" onClick={today}>
					{ t('vc.Calendar.today') }
				</ButtonComponent>
			</div>
		);
	};

	const renderWeek = () => {
		return slots.week
			? slots.week({ weekdays: selection.weekdays.value })
			: (
					<div class="vc-calendar__week">
						{ selection.weekdays.value.map((item, index) => <span key={index} class="vc-calendar__weekday">{ item }</span>) }
					</div>
				);
	};

	const renderYear = () => {
		return (
			<div key={year.value} class="vc-calendar__year">
				{
					MONTHS.map((value) => {
						return (
							<div
								key={value}
								class="vc-calendar__year-item"
								onClick={() => {
									setPanelDate(new Date(year.value, value, 1));
									setMode('month');
								}}
							>
								<div class="vc-calendar__month-title">{ getMonthName(value) }</div>
								<CalendarMonth year={year.value} month={value} adjacent={false} mini week />
							</div>
						);
					})
				}
			</div>
		);
	};

	return () => {
		return (
			<div
				class={[
					mobile ? 'vc-calendar vcm-calendar' : 'vc-calendar',
					`is-${currentMode.value}`,
					{ 'is-readonly': props.readonly }
				]}
			>
				{ renderHeader() }
				{ !isYear.value && renderWeek() }
				<div class="vc-calendar__body" {...(mobile ? drag.listeners : {})}>
					<Transition name={`vc-calendar__${slideMode.value}`}>
						{
							isYear.value
								? renderYear()
								: (
										<CalendarMonth
											key={`${year.value}-${month.value}`}
											year={year.value}
											month={month.value}
											adjacentWeeks={adjacentWeeks.value}
										/>
									)
						}
					</Transition>
				</div>
			</div>
		);
	};
};
