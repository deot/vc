import type { VNodeChild } from 'vue';
import type { CalendarHoliday } from './date2holiday/types';

export type CalendarLang = string;
export type CalendarCellType = 'prev' | 'current' | 'next' | string;
export type CalendarFirstDayOfWeek = number;
export type CalendarAdjacentWeeks = boolean | [boolean, boolean];

export interface CalendarCell {
	date: number;
	value: string;
	type: CalendarCellType;
}

export interface CalendarMonthData {
	year: number;
	month: number;
	data: CalendarCell[];
}

export interface RenderDateProps {
	cell: CalendarCell;
	today: string;
	holiday: CalendarHoliday;
}

export interface RenderMonthProps {
	data: {
		month: string;
		year: number;
	};
	month: number;
	year: number;
	lang: CalendarLang;
}

export interface RenderWeekProps {
	data: string[];
	date: string[];
	lang: CalendarLang;
	firstDayOfWeek: CalendarFirstDayOfWeek;
}

export type CalendarRender<T> = (options: T) => VNodeChild;
