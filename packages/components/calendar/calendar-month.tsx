/** @jsxImportSource vue */

import { computed, defineComponent } from 'vue';
import type { PropType } from 'vue';
import { useLocale } from '../locale';
import { Date2Holiday } from './date2holiday';
import { useCalendarContext } from './use-calendar-selection';
import { getCalendarDates, getMonthDays, getLeadingDays, toDateKey } from './utils';
import type { CalendarCell, CalendarCellType } from './types';

const COMPONENT_NAME = 'vc-calendar-month';

interface DateItem {
	date: Date;
	time: number;
	key: string;
	day: number;
	type: CalendarCellType;
}

interface LunarText {
	text: string;
	// 节日、节气
	highlight: boolean;
}

/**
 * 节日 > 节气 > 农历日；初一显示月名
 * @param key YYYY-MM-DD
 * @param lang ~
 * @returns ~
 */
const getLunarText = (key: string, lang: string): LunarText | undefined => {
	const info = Date2Holiday.get(key, lang);
	if (info.holiday) return { text: info.holiday, highlight: true };
	if (!info.lunarDateText) return;

	return {
		text: info.lunarDate === 1 ? `${info.lunarMonthText}月` : info.lunarDateText,
		highlight: false
	};
};

/**
 * 月网格：Calendar 的月视图、年视图的迷你月与 MCalendarPicker 列表中的每个月共用
 * 状态来自 useCalendarSelection 提供的上下文
 */
export const CalendarMonth = defineComponent({
	name: COMPONENT_NAME,
	props: {
		year: {
			type: Number,
			required: true
		},
		// 0 - 11
		month: {
			type: Number,
			required: true
		},
		// 显示其它月份的日期；为 false 时用空格占位，且只保留含本月日期的周
		adjacent: {
			type: Boolean,
			default: true
		},
		// [首部, 尾部] 整周都不属于本月时是否保留（adjacent 为 true 时生效）
		adjacentWeeks: {
			type: Array as unknown as PropType<[boolean, boolean]>,
			default: () => [false, true]
		},
		// 迷你月（年视图）：只显示日期数字，不可点选，没有插槽与农历
		mini: Boolean,
		// 在网格上方显示星期
		week: Boolean,
		title: String
	},
	setup(props) {
		const calendar = useCalendarContext();
		const { slots, Scroller } = calendar;
		const { lang, t } = useLocale();

		const rows = computed(() => {
			const items: DateItem[] = getCalendarDates(props.year, props.month, calendar.firstDayOfWeek.value).map((date) => {
				const offset = (date.getFullYear() - props.year) * 12 + date.getMonth() - props.month;
				return {
					date,
					time: date.getTime(),
					key: toDateKey(date),
					day: date.getDate(),
					type: offset < 0 ? 'previous' : offset > 0 ? 'next' : 'current'
				};
			});
			const count = props.adjacent
				? 6
				: Math.ceil((getLeadingDays(props.year, props.month, calendar.firstDayOfWeek.value) + getMonthDays(props.year, props.month)) / 7);
			const [keepFirst, keepLast] = props.adjacentWeeks;

			return Array.from({ length: count }, (_, index) => items.slice(index * 7, index * 7 + 7)).filter((row) => {
				if (!props.adjacent) return true;
				if (row[0].type === 'previous' && row[6].type === 'previous') return keepFirst;
				if (row[0].type === 'next') return keepLast;
				return true;
			});
		});

		// 农历文字按月计算一次，选中状态变化不会重算
		const lunarTexts = computed(() => {
			if (props.mini || !calendar.isLunar() || lang.value !== 'zh-CN') return null;

			const map = new Map<number, LunarText | undefined>();
			rows.value.forEach(row => row.forEach((item) => {
				(props.adjacent || item.type === 'current') && map.set(item.time, getLunarText(item.key, lang.value));
			}));
			return map;
		});

		const createCell = (item: DateItem, state: Omit<CalendarCell, 'date' | 'value' | 'day' | 'type' | 'holiday'>): CalendarCell => {
			return {
				date: item.date,
				value: item.key,
				day: item.day,
				type: item.type,
				...state,
				get holiday() {
					return Date2Holiday.get(item.key, lang.value);
				}
			};
		};

		const getMark = (state: { today: boolean; start: boolean; end: boolean; inRange: boolean }) => {
			if (state.start && state.end) return t('vc.Calendar.startAndEnd');
			if (state.start) return t('vc.Calendar.start');
			if (state.end) return t('vc.Calendar.end');
			if (state.today && !state.inRange) return t('vc.Calendar.today');
		};

		const renderCell = (item: DateItem) => {
			if (!props.adjacent && item.type !== 'current') {
				return <div key={item.time} class="vc-calendar__cell is-placeholder" />;
			}

			const { times, start, end } = calendar.selection.value;
			const isStart = item.time === start;
			const isEnd = item.time === end;
			const state = {
				today: item.time === calendar.todayTime,
				selected: times.has(item.time) || isStart || isEnd,
				start: isStart,
				end: isEnd,
				inRange: item.time >= start && item.time <= end,
				disabled: calendar.isDisabled(item.date)
			};
			const classes = [
				'vc-calendar__cell',
				`is-${item.type}`,
				{
					'is-today': state.today,
					'is-selected': state.selected,
					'is-start': state.start,
					'is-end': state.end,
					'is-range': state.inRange,
					'is-disabled': state.disabled
				}
			];

			if (props.mini) {
				return (
					<div key={item.time} class={classes}>
						<span class="vc-calendar__day">{ item.day }</span>
					</div>
				);
			}

			const cell = (slots.cell || slots.content) && createCell(item, state);
			if (slots.cell) {
				return <div key={item.time} class={classes} data-time={item.time}>{ slots.cell(cell) }</div>;
			}

			const lunar = lunarTexts.value?.get(item.time);
			const mark = calendar.marks && getMark(state);
			return (
				<div key={item.time} class={classes} data-time={item.time}>
					{ calendar.marks && <div class="vc-calendar__mark">{ mark }</div> }
					<div class="vc-calendar__date">
						<span class="vc-calendar__day">{ item.day }</span>
						{
							lunar && (
								<span class={['vc-calendar__lunar', { 'is-highlight': lunar.highlight }]}>
									{ lunar.text }
								</span>
							)
						}
					</div>
					{
						slots.content && (
							<Scroller class="vc-calendar__content" contentClass="vc-calendar__inner" axis="y">
								{ slots.content(cell) }
							</Scroller>
						)
					}
				</div>
			);
		};

		const getDate = (e: Event) => {
			const target = (e.target as HTMLElement).closest?.('[data-time]') as HTMLElement | null;
			return target ? new Date(Number(target.dataset.time)) : null;
		};

		const handleClick = (e: MouseEvent) => {
			const date = getDate(e);
			date && calendar.pick(date);
		};

		const handleMouseover = (e: MouseEvent) => {
			const date = getDate(e);
			date && !calendar.isDisabled(date) && calendar.hover(date);
		};

		const handleMouseleave = () => calendar.hover(null);

		return () => {
			const hoverable = calendar.hoverable && !props.mini;
			return (
				<div class={['vc-calendar__month', { 'is-mini': props.mini }]}>
					{ props.title && <div class="vc-calendar__month-title">{ props.title }</div> }
					{
						props.week && (
							<div class="vc-calendar__week">
								{ calendar.weekdays.value.map((item, index) => <span key={index} class="vc-calendar__weekday">{ item }</span>) }
							</div>
						)
					}
					<div
						class="vc-calendar__rows"
						onClick={props.mini ? undefined : handleClick}
						onMouseover={hoverable ? handleMouseover : undefined}
						onMouseleave={hoverable ? handleMouseleave : undefined}
					>
						{
							rows.value.map((row) => {
								return (
									<div key={row[0].time} class="vc-calendar__row">
										{ row.map(renderCell) }
									</div>
								);
							})
						}
					</div>
				</div>
			);
		};
	}
});
