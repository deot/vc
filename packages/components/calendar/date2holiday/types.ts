export type CalendarFestivalType = 'a' | 'c' | 'h' | 'i' | 't';

export interface CalendarFestival {
	type: CalendarFestivalType;
	desc: string;
	value: string;
}

export interface CalendarHoliday {
	holiday: string;
	festivals: CalendarFestival[];
	animal?: string;
	gzDate?: string;
	gzMonth?: string;
	gzYear?: string;
	lunarYear?: number;
	lunarMonth?: number;
	lunarDate?: number;
	lMonth?: string;
	lDate?: string;
	solarTerm?: string;
	isBigMonth?: boolean;
	oDate?: Date;
	weekDay?: number;
	cnWeekDay?: string;
}
