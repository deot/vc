export type CalendarFestivalType = 'a' | 'c' | 'h' | 'i' | 't';

export interface CalendarFestival {
	type: CalendarFestivalType;
	description: string;
	value: string;
}

export interface CalendarHoliday {
	holiday: string;
	festivals: CalendarFestival[];
	animal?: string;
	ganzhiDate?: string;
	ganzhiMonth?: string;
	ganzhiYear?: string;
	lunarYear?: number;
	lunarMonth?: number;
	lunarDate?: number;
	lunarMonthText?: string;
	lunarDateText?: string;
	solarTerm?: string;
	isBigMonth?: boolean;
	originalDate?: Date;
	weekDay?: number;
	chineseWeekDay?: string;
}
