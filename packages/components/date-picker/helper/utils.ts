import { dayjs, type ConfigType } from './dayjs';
import { translate } from '../../locale';
import { VcInstance } from '../../vc';

const formatYearQuarter = (year: number, quarter: string) => {
	const locale = VcInstance.options.locale;
	return translate('vc.DatePicker.yearQuarter', {
		year,
		quarter: translate(`vc.DatePicker.quarter.${quarter}`, undefined, locale)
	}, locale);
};

/* -----------------------------  日期工具（DatePicker / Calendar / Countdown 共用） ------------------------------------------- */

// 未传 firstDayOfWeek 且全局未配置时从周日开始
export const DEFAULT_FIRST_DAY_OF_WEEK = 7;

// 与 MDatePicker 相同的默认年份范围，也是农历数据覆盖的范围
export const DEFAULT_YEAR_RANGE = [1900, 2100];

/**
 * 转成 Date；空值（undefined、null、''）与非法值为 null
 * 	- dayjs(undefined) 是现在，空值不能当成今天，所以先在这里归一
 * @param value ~
 * @returns ~
 */
export const toDate = (value: unknown): Date | null => {
	if (value === undefined || value === null || value === '') return null;
	const date = dayjs(value as ConfigType);
	return date.isValid() ? date.toDate() : null;
};

/**
 * 当天 0 点的时间戳；空值（如范围还没选的一端）与非法值为 NaN，比较结果都是 false
 * @param value ~
 * @returns ~
 */
export const getDateTimestamp = (value: unknown) => {
	const date = toDate(value);
	return date ? date.setHours(0, 0, 0, 0) : NaN;
};

/**
 * 某月的天数；dayjs 的 daysInMonth 在公元 0 ~ 99 年会按 1900 ~ 1999 年算，这里用 setFullYear 避开
 * @param year ~
 * @param month 0 ~ 11，越界时进位到相邻年份
 * @returns ~
 */
export const getDayCountOfMonth = (year: number, month: number) => {
	const date = new Date(0);
	date.setFullYear(year, month + 1, 0);
	return date.getDate();
};

/**
 * 换成指定的年、月，日超出当月天数时取当月最后一天（2010-1-31 → 2010 年 2 月 = 2010-2-28），时分秒不变
 * @param date ~
 * @param year ~
 * @param month 0 ~ 11，越界时进位到相邻年份
 * @returns ~
 */
export const changeYearMonthAndClampDate = (date: Date, year: number, month: number) => {
	const value = new Date(date);
	value.setFullYear(year, month, Math.min(date.getDate(), getDayCountOfMonth(year, month)));
	return value;
};

interface TimeParts {
	hours?: number;
	minutes?: number;
	seconds?: number;
}

/**
 * 日期换成指定的时、分、秒（未给的沿用原值），毫秒归零
 * @param date ~
 * @param time ~
 * @returns ~
 */
export const getDateOfTime = (date: Date, time: TimeParts = {}) => {
	const pick = (value: number | undefined, fallback: number) => (value! >= 0 ? value! : fallback);
	const value = new Date(date);
	value.setHours(pick(time.hours, date.getHours()), pick(time.minutes, date.getMinutes()), pick(time.seconds, date.getSeconds()), 0);
	return value;
};

const normalizeFirstDayOfWeek = (firstDayOfWeek = DEFAULT_FIRST_DAY_OF_WEEK): number => {
	const day = ((Math.trunc(firstDayOfWeek) - 1) % 7 + 7) % 7 + 1;
	return day === 7 ? 0 : day;
};

/**
 * 按每周第一天重排星期
 * @param weekdays 从周日开始
 * @param firstDayOfWeek 1 - 7
 * @returns ~
 */
export const sortWeekdays = <T>(weekdays: T[], firstDayOfWeek = DEFAULT_FIRST_DAY_OF_WEEK): T[] => {
	const start = normalizeFirstDayOfWeek(firstDayOfWeek);
	return [...weekdays.slice(start), ...weekdays.slice(0, start)];
};

/**
 * 当月 1 日之前要补的天数：往前补到每周第一天（1 日正好是第一天时不补）
 * @param year ~
 * @param month 0 - 11
 * @param firstDayOfWeek 1 - 7
 * @returns 0 - 6
 */
export const getLeadingDays = (year: number, month: number, firstDayOfWeek: number) => {
	return (new Date(year, month, 1).getDay() - normalizeFirstDayOfWeek(firstDayOfWeek) + 7) % 7;
};

/**
 * 月历的 42 天（6 周），从补齐的上月日期开始
 * @param year ~
 * @param month 0 - 11
 * @param firstDayOfWeek 1 - 7
 * @returns Date[]
 */
export const getCalendarDates = (year: number, month: number, firstDayOfWeek = DEFAULT_FIRST_DAY_OF_WEEK) => {
	const leading = getLeadingDays(year, month, firstDayOfWeek);
	return Array.from({ length: 42 }, (_, index) => new Date(year, month, index - leading + 1));
};

/* -----------------------------  PC ------------------------------------------- */
export const formatDate = (value: unknown, format: string) => {
	const date = toDate(value);
	return date ? dayjs(date).format(format || 'YYYY-MM-DD') : '';
};

// dayjs 的 MM、DD 只认两位（HH、mm 等本来就接受一位），解析时放宽为 M、D：2024-3-5 也按 YYYY-MM-DD 解析；[...] 内的文字与 MMM / MMMM 不动
const LOOSE_TOKEN_REGEX = /\[[^\]]*\]|M{3,4}|MM|DD/g;

/**
 * 按格式解析，非法时为 null
 * @param value ~
 * @param format ~
 * @returns ~
 */
export const parseDate = (value: any, format: string) => {
	if (value instanceof Date) return value;
	const looseFormat = (format || 'YYYY-MM-DD').replace(LOOSE_TOKEN_REGEX, token => (token.length === 2 ? token[0] : token));
	const date = dayjs(value, looseFormat);
	return date.isValid() ? date.toDate() : null;
};

const DATE_FORMATTER = (value: any, format: string) => {
	return formatDate(value, format);
};
const DATE_PARSER = (text: any, format: string) => {
	return parseDate(text, format);
};
const RANGE_FORMATTER = (value: any[] | Date, format: string, RANGE_SEPARATOR: string) => {
	if (Array.isArray(value) && value.length === 2 && value[0] && value[1]) {
		return formatDate(value[0], format) + RANGE_SEPARATOR + formatDate(value[1], format);
	} else if (!Array.isArray(value) && value instanceof Date) {
		return formatDate(value, format);
	}
	return '';
};
const RANGE_PARSER = (text: string | any[], format: string, RANGE_SEPARATOR: string) => {
	const array = Array.isArray(text) ? text : text.split(RANGE_SEPARATOR);
	const range1 = array[0];
	const range2 = array[1];
	if (array.length === 2 && range1 && range2) {
		return [
			range1 instanceof Date ? range1 : parseDate(range1, format),
			range2 instanceof Date ? range2 : parseDate(range2, format)
		];
	}
	return [];
};

export const TYPE_VALUE_RESOLVER_MAP = {
	default: {
		formatter(value: Date) {
			if (!value) return '';
			return '' + value;
		},
		parser(text: any) {
			if (text === undefined || text === '') return null;
			return text;
		},
	},
	date: {
		formatter: DATE_FORMATTER,
		parser: DATE_PARSER
	},
	datetime: {
		formatter: DATE_FORMATTER,
		parser: DATE_PARSER
	},
	daterange: {
		formatterText: RANGE_FORMATTER,
		formatter: (value: Date[], format: string, RANGE_SEPARATOR: string) => {
			const rangeDate = RANGE_FORMATTER(value, format, RANGE_SEPARATOR);
			return rangeDate ? rangeDate.split(RANGE_SEPARATOR) : [];
		},
		parser: RANGE_PARSER
	},
	datetimerange: {
		formatterText: RANGE_FORMATTER,
		formatter: (value: Date[], format: string, RANGE_SEPARATOR: string) => {
			const rangeDate = RANGE_FORMATTER(value, format, RANGE_SEPARATOR);
			return rangeDate ? rangeDate.split(RANGE_SEPARATOR) : [];
		},
		parser: RANGE_PARSER
	},
	timerange: {
		formatterText: RANGE_FORMATTER,
		formatter: (value: Date[], format: string, RANGE_SEPARATOR: string) => {
			const rangeDate = RANGE_FORMATTER(value, format, RANGE_SEPARATOR);
			return rangeDate ? rangeDate.split(RANGE_SEPARATOR) : [];
		},
		parser: RANGE_PARSER
	},
	time: {
		formatter: DATE_FORMATTER,
		parser: DATE_PARSER
	},
	month: {
		formatter: DATE_FORMATTER,
		parser: (text: any, format: string) => {
			return [DATE_PARSER(text, format)];
		}
	},
	monthrange: {
		formatterText: RANGE_FORMATTER,
		formatter: (value: Date[], format: string, RANGE_SEPARATOR: string) => {
			const rangeDate = RANGE_FORMATTER(value, format, RANGE_SEPARATOR);
			return rangeDate ? rangeDate.split(RANGE_SEPARATOR) : [];
		},
		parser: RANGE_PARSER
	},
	year: {
		formatter: DATE_FORMATTER,
		parser: (text: any, format: string) => {
			return [DATE_PARSER(text, format)];
		}
	},
	quarter: {
		formatterText: (value: Date[]) => {
			const [startDate, endDate] = value;
			if (startDate && endDate) {
				const year = startDate.getFullYear();
				const startMonth = startDate.getMonth();
				const endMonth = endDate.getMonth();
				if (startMonth === 0 && endMonth === 2) {
					return formatYearQuarter(year, 'first');
				} else if (startMonth === 3 && endMonth === 5) {
					return formatYearQuarter(year, 'second');
				} else if (startMonth === 6 && endMonth === 8) {
					return formatYearQuarter(year, 'third');
				} else if (startMonth === 9 && endMonth === 11) {
					return formatYearQuarter(year, 'fourth');
				}
			}
		},
		formatter: (value = [], format: string) => {
			return value.map(date => DATE_FORMATTER(date, format));
		},
		parser: (text: any[], format: string) => {
			const dates = text.map((str: string) => DATE_PARSER(str, format));
			return dates;
		}
	},
	quarterrange: {
		formatterText: (value: Date[], _format: string, RANGE_SEPARATOR: string) => {
			const startQuarterMap = {
				0: 'first',
				3: 'second',
				6: 'third',
				9: 'fourth',
			};
			const endQuarterMap = {
				2: 'first',
				5: 'second',
				8: 'third',
				11: 'fourth',
			};
			const [startDate, endDate] = value;
			if (startDate && endDate) {
				const startYear = startDate.getFullYear();
				const startMonth = startDate.getMonth();
				const endYear = endDate.getFullYear();
				const endMonth = endDate.getMonth();
				return formatYearQuarter(startYear, startQuarterMap[startMonth])
					+ RANGE_SEPARATOR + formatYearQuarter(endYear, endQuarterMap[endMonth]);
			}
		},
		formatter: (value = [], format: string) => {
			return value.map(date => DATE_FORMATTER(date, format));
		},
		parser: (text: any[], format: string) => {
			const dates = text.map(str => DATE_PARSER(str, format));
			return dates;
		}
	},
	multiple: {
		formatterText: (value: Date[], format: string) => {
			return value.filter(Boolean).map(date => formatDate(date, format)).join(',');
		},
		formatter: (value: Date[], format: string) => {
			return value.filter(Boolean).map(date => formatDate(date, format));
		},
		parser: (value: any[] | string, format: string) => {
			const values = typeof value === 'string' ? value.split(',') : value;
			return values.map((value$: any) => {
				if (value$ instanceof Date) return value$;
				if (typeof value$ === 'string') value$ = value$.trim();
				else if (typeof value$ !== 'number' && !value$) value$ = '';
				return parseDate(value$, format);
			});
		}
	},
	number: {
		formatter(value: Date) {
			if (!value) return '';
			return '' + value;
		},
		parser(text: any) {
			const result = Number(text);

			if (!isNaN(text)) {
				return result;
			} else {
				return null;
			}
		}
	}
};

export const isValidDate = (value: any): value is Date => {
	return value instanceof Date && !isNaN(value.getTime());
};

const getDigits = (text: string) => (text.match(/\d+/g) || []).map(Number).join();

/**
 * 两段文字里的数字是否逐个相同：键入的文字解析后按格式输出，以此判断没有溢出（如 2 月 30 日、25 点）
 * 	- 数字可以不补零、分隔符可以不同（如 2024-4-2、2024/04/02）
 * @param a ~
 * @param b ~
 * @returns ~
 */
export const isSameDigits = (a: string, b: string) => getDigits(a) === getDigits(b);

export interface DisabledTimeOptions {
	disabledHours?: number[];
	disabledMinutes?: number[];
	disabledSeconds?: number[];
	disabledTime?: (date: Date) => boolean;
}

/**
 * 时间是否被禁用：时、分、秒在禁用列表里，或 disabledTime 判为禁用（与时间列的选项一致）
 * @param date ~
 * @param options ~
 * @returns ~
 */
export const isDisabledTime = (date: Date, options: DisabledTimeOptions) => {
	const { disabledHours, disabledMinutes, disabledSeconds, disabledTime } = options;
	return !!disabledHours?.includes(date.getHours())
		|| !!disabledMinutes?.includes(date.getMinutes())
		|| !!disabledSeconds?.includes(date.getSeconds())
		|| !!disabledTime?.(date);
};

/**
 * 月份是否被禁用：只要其中某一天（当天的开始或结束）被禁用，就禁用该月份
 * @param year ~
 * @param month 0 ~ 11
 * @param disabledDate ~
 * @returns ~
 */
export const isDisabledMonth = (year: number, month: number, disabledDate: (date: Date) => boolean) => {
	const monthDay = getDayCountOfMonth(year, month);
	for (let i = 1; i <= monthDay; i++) {
		if (disabledDate(new Date(year, month, i, 0, 0, 0)) || disabledDate(new Date(year, month, i, 23, 59, 59))) {
			return true;
		}
	}
	return false;
};

export const value2Array = (val) => {
	if (Array.isArray(val)) {
		return val;
	} else if (val) {
		return [val];
	} else {
		return [];
	}
};

/**
 * 日期数据是否是空的
 * @param val ~
 * @returns ~
 */
export const isEmpty = (val: any) => {
	if (val instanceof Array) {
		if (val.length > 0) {
			return val.every(v => !v);
		}
		return true;
	}
	return val === 0 || val === '' || val === undefined || val === null || val.length === 0;
};

/**
 * 获取当前时间所属季度
 * @param date ~
 * @returns string ~
 */
export const getQuarter = (date: Date) => {
	const month = date.getMonth() + 1;
	if (month <= 3) return '1';
	if (month <= 6) return '2';
	if (month <= 9) return '3';
	if (month <= 12) return '4';
};
