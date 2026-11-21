import { preZero } from '@deot/helper-utils';
import type { CalendarFirstDayOfWeek } from './types';

// 未传 firstDayOfWeek 且全局未配置时从周日开始
export const DEFAULT_FIRST_DAY_OF_WEEK = 7;

// 与 MDatePicker 相同的默认年份范围，也是农历数据覆盖的范围
export const DEFAULT_YEAR_RANGE = [1900, 2100];

export const normalizeFirstDayOfWeek = (firstDayOfWeek: CalendarFirstDayOfWeek = DEFAULT_FIRST_DAY_OF_WEEK): number => {
	const day = ((Math.trunc(firstDayOfWeek) - 1) % 7 + 7) % 7 + 1;

	return day === 7 ? 0 : day;
};

export const sortWeekdays = <T>(
	weekdays: T[],
	firstDayOfWeek: CalendarFirstDayOfWeek = DEFAULT_FIRST_DAY_OF_WEEK
): T[] => {
	const start = normalizeFirstDayOfWeek(firstDayOfWeek);

	return [
		...weekdays.slice(start),
		...weekdays.slice(0, start)
	];
};

/**
 * 当月 1 日之前要补的天数：往前补到每周第一天（1 日正好是第一天时不补）
 * @param year ~
 * @param month 0 - 11
 * @param firstDayOfWeek 1 - 7
 * @returns 0 - 6
 */
export const getLeadingDays = (year: number, month: number, firstDayOfWeek: CalendarFirstDayOfWeek) => {
	return (new Date(year, month, 1).getDay() - normalizeFirstDayOfWeek(firstDayOfWeek) + 7) % 7;
};

/**
 * 月历的 42 天（6 周），从补齐的上月日期开始
 * @param year ~
 * @param month 0 - 11
 * @param firstDayOfWeek 1 - 7
 * @returns Date[]
 */
export const getCalendarDates = (year: number, month: number, firstDayOfWeek: CalendarFirstDayOfWeek = DEFAULT_FIRST_DAY_OF_WEEK) => {
	const leading = getLeadingDays(year, month, firstDayOfWeek);

	return Array.from({ length: 42 }, (_, index) => new Date(year, month, index - leading + 1));
};

export const getMonthDays = (year: number, month: number) => {
	return new Date(year, month + 1, 0).getDate();
};

/**
 * 日期在当天 0 点的时间戳
 * @param date ~
 * @returns number
 */
export const getDayTime = (date: Date) => {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};

/**
 * YYYY-MM-DD，用于 key 与农历查询
 * @param date ~
 * @returns string
 */
export const toDateKey = (date: Date) => {
	return `${date.getFullYear()}-${preZero(date.getMonth() + 1)}-${preZero(date.getDate())}`;
};
