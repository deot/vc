import { preZero } from '@deot/helper-utils';
import type { CalendarCell, CalendarCellType, CalendarFirstDayOfWeek, CalendarMonthData, CalendarName } from './types';

export const normalizeFirstDayOfWeek = (firstDayOfWeek: CalendarFirstDayOfWeek = 1): number => {
	const day = ((Math.trunc(firstDayOfWeek) - 1) % 7 + 7) % 7 + 1;

	return day === 7 ? 0 : day;
};

export const sortWeekNames = (
	weekNames: CalendarName[],
	firstDayOfWeek: CalendarFirstDayOfWeek = 1
): CalendarName[] => {
	const start = normalizeFirstDayOfWeek(firstDayOfWeek);

	return [
		...weekNames.slice(start),
		...weekNames.slice(0, start)
	];
};

export const createDaysArray = (
	year: number,
	month: number,
	days: number,
	type: CalendarCellType
): CalendarCell[] => {
	return Array.from({ length: days }, (_, index) => {
		return {
			date: index + 1,
			value: `${year}-${preZero(month)}-${preZero(index + 1)}`,
			type
		};
	});
};

export const getMonthDays = (year: number, month: number) => {
	return new Date(year, month, 0).getDate();
};

export const getWeek = (dateString?: string | null): number => {
	if (!dateString) {
		return new Date().getDay();
	}

	const [year, month, day] = dateString.split('-').map(i => parseInt(i, 10));
	return new Date(year, month - 1, day).getDay();
};

export const getMonthData = (
	year: number,
	month: number,
	firstDayOfWeek: CalendarFirstDayOfWeek = 1
): CalendarMonthData => {
	if (month === 0) {
		year -= 1;
		month = 12;
	} else if (month === 13) {
		year += 1;
		month = 1;
	}

	let prevYear = year;
	let nextYear = year;
	let prevMonth = month - 1;
	let nextMonth = month + 1;

	if (month === 1) {
		prevYear = year - 1;
		prevMonth = 12;
	} else if (month === 12) {
		nextYear = year + 1;
		nextMonth = 1;
	}

	const prevData = createDaysArray(prevYear, prevMonth, getMonthDays(prevYear, prevMonth), 'prev');
	const currentData = createDaysArray(year, month, getMonthDays(year, month), 'current');
	const nextData = createDaysArray(nextYear, nextMonth, getMonthDays(nextYear, nextMonth), 'next');
	const firstWeek = getWeek(`${year}-${preZero(month)}-1`);
	const prevDays = (firstWeek - normalizeFirstDayOfWeek(firstDayOfWeek) + 7) % 7;

	return {
		year,
		month,
		data: [
			...prevData.slice(prevData.length - prevDays, prevData.length),
			...currentData,
			...nextData.slice(0, 42 - prevDays - currentData.length)
		]
	};
};

export const formatDate = (date: Date) => {
	return `${date.getFullYear()}-${preZero(date.getMonth() + 1)}-${preZero(date.getDate())}`;
};
