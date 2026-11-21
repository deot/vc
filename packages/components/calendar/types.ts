import type { CalendarHoliday } from './date2holiday/types';

export type CalendarType = 'date' | 'daterange';
export type CalendarMode = 'month' | 'year';
export type CalendarCellType = 'previous' | 'current' | 'next';
export type CalendarFirstDayOfWeek = number;
export type CalendarAdjacentWeeks = boolean | [boolean, boolean];

/**
 * 日期格子的状态：content、cell 插槽与 date-click 事件的参数
 * holiday 为 getter，读取时才计算农历、节气与节日
 */
export interface CalendarCell {
	date: Date;
	// YYYY-MM-DD
	value: string;
	day: number;
	type: CalendarCellType;
	today: boolean;
	selected: boolean;
	start: boolean;
	end: boolean;
	inRange: boolean;
	disabled: boolean;
	readonly holiday: CalendarHoliday;
}

export interface CalendarHeaderSlotProps {
	year: number;
	// 0 - 11
	month: number;
	mode: CalendarMode;
	title: string;
	previous: () => void;
	next: () => void;
	today: () => void;
	setMode: (mode: CalendarMode) => void;
}

export interface CalendarWeekSlotProps {
	weekdays: string[];
}

export interface CalendarDateClickEvent {
	date: Date;
	// 按 format 格式化的值
	value: string;
}
