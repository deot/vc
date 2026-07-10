import type { VNodeChild } from 'vue';

export type CalendarLang = 'ch' | 'en' | string;
export type CalendarCellType = 'prev' | 'current' | 'next' | string;
export type CalendarFirstDayOfWeek = number;
export type CalendarAdjacentWeeks = boolean | [boolean, boolean];

export interface CalendarName {
	ch: string;
	en: string;
	[key: string]: string;
}

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

export interface CalendarHoliday {
	holiday: string;
	festivals?: Array<{
		type: string;
		desc: string;
		value: string;
	}>;
	[key: string]: any;
}

export interface RenderDateProps {
	cell: CalendarCell;
	today: string;
	holiday: CalendarHoliday;
}

export interface RenderMonthProps {
	month: number;
	year: number;
	lang: CalendarLang;
	monthNames: CalendarName[];
}

export interface RenderWeekProps {
	weekNames: CalendarName[];
	lang: CalendarLang;
	firstDayOfWeek: CalendarFirstDayOfWeek;
}

export type CalendarRender<T> = (options: T) => VNodeChild;
