import { preZero } from '@deot/helper-utils';
import { DateUtil } from './date';

const isShortMonth = (month) => {
	return [4, 6, 9, 11].indexOf(month) > -1;
};

const isLeapYear = (year) => {
	return (year % 400 === 0) || (year % 100 !== 0 && year % 4 === 0);
};

export const getMonthEndDay = (year, month) => {
	month = Number(month);
	if (isShortMonth(month)) {
		return 30;
	} else if (month === 2) {
		return isLeapYear(year) ? 29 : 28;
	} else {
		return 31;
	}
};

export const value2date = (v = []) => {
	let result: any[] = [];
	for (let i = 0; i < 5 - v.length; i++) {
		result.push(false);
	}
	result = [...v, ...result];
	const Y = result[0] || new Date().getFullYear();
	const M = result[1] || new Date().getMonth() * 1 + 1;

	const endDate = getMonthEndDay(Y, M);
	const nowDate = new Date().getDate();

	const D = result[2] || (endDate < nowDate ? endDate : nowDate);

	const target = {
		Y,
		M,
		D,
		H: result[3] || '00',
		m: result[4] || '00',
	};
	return new Date(
		target.Y,
		target.M * 1 - 1,
		target.D,
		target.H,
		target.m
	);
};

/**
 * YMDHm: Month与Minutes冲突 -> M, m
 * @param v ~
 * @param format ~
 * @returns ~
 */
export const date2value = (v: string | Date, format = 'YMDHm') => {
	if (!v) return;

	if (typeof v === 'string') {
		v = new Date(v.replace('-', '/'));
	}

	const target = {
		Y: v.getFullYear() + '',
		M: v.getMonth() * 1 + 1 + '',
		D: v.getDate() + '',
		H: v.getHours() + '',
		m: v.getMinutes() + '',
	};
	const typeArr = typeof format === 'string' ? format.split('') : format; // 'YMDHm'

	const result = typeArr.map(item => preZero(target[item]));

	return result;
};

export const parseMode = (value: string) => {
	let mode: string;
	switch (value) {
		case 'datetime':
			mode = 'YMDHm';
			break;
		case 'date':
			mode = 'YMD';
			break;
		case 'time':
			mode = 'Hm';
			break;
		case 'yearmonth':
			mode = 'YM';
			break;
		case 'year':
			mode = 'Y';
			break;
		case 'month':
			mode = 'M';
			break;
		case 'quarter':
			mode = 'YQ';
			break;
		default:
			mode = value;
			break;
	}

	return mode;
};

/* -----------------------------  PC ------------------------------------------- */
export const toDate = (date: Date | number | string) => {
	date = new Date(date);
	if (isNaN(date.getTime())) return null;
	return date;
};

export const formatDate = (date: any, format: string) => {
	date = toDate(date);
	if (!date) return '';
	return DateUtil.format(date, format || 'YYYY-MM-DD');
};

export const parseDate = (value: any, format: string) => {
	if (value instanceof Date) return value;
	return DateUtil.parse(value, format || 'YYYY-MM-DD');
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
		formatter(value: any) {
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
		formatter: (value: any, format: string, RANGE_SEPARATOR: string) => {
			const rangeDate = RANGE_FORMATTER(value, format, RANGE_SEPARATOR);
			return rangeDate ? rangeDate.split(RANGE_SEPARATOR) : [];
		},
		parser: RANGE_PARSER
	},
	datetimerange: {
		formatterText: RANGE_FORMATTER,
		formatter: (value: any, format: string, RANGE_SEPARATOR: string) => {
			const rangeDate = RANGE_FORMATTER(value, format, RANGE_SEPARATOR);
			return rangeDate ? rangeDate.split(RANGE_SEPARATOR) : [];
		},
		parser: RANGE_PARSER
	},
	timerange: {
		formatterText: RANGE_FORMATTER,
		formatter: (value: any, format: string, RANGE_SEPARATOR: string) => {
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
		formatter: (value: any, format: string, RANGE_SEPARATOR: string) => {
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
		formatterText: (value: any[]) => {
			const [startDate, endDate] = value;
			if (startDate && endDate) {
				const year = startDate.getFullYear();
				const startMonth = startDate.getMonth();
				const endMonth = endDate.getMonth();
				if (startMonth === 0 && endMonth === 2) {
					return `${year}年第一季度`;
				} else if (startMonth === 3 && endMonth === 5) {
					return `${year}年第二季度`;
				} else if (startMonth === 6 && endMonth === 8) {
					return `${year}年第三季度`;
				} else if (startMonth === 9 && endMonth === 11) {
					return `${year}年第四季度`;
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
		formatterText: (value: any, _format: string, RANGE_SEPARATOR: string) => {
			const startQuarterMap = {
				0: '第一季度',
				3: '第二季度',
				6: '第三季度',
				9: '第四季度',
			};
			const endQuarterMap = {
				2: '第一季度',
				5: '第二季度',
				8: '第三季度',
				11: '第四季度',
			};
			const [startDate, endDate] = value;
			if (startDate && endDate) {
				const startYear = startDate.getFullYear();
				const startMonth = startDate.getMonth();
				const endYear = endDate.getFullYear();
				const endMonth = endDate.getMonth();
				return `${startYear}年${startQuarterMap[startMonth]}${RANGE_SEPARATOR}${endYear}年${endQuarterMap[endMonth]}`;
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
		formatterText: (value: any[], format: string) => {
			return value.filter(Boolean).map(date => formatDate(date, format)).join(',');
		},
		formatter: (value: any[], format: string) => {
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
		formatter(value: any) {
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

export const setNewYear = (currentDate: Date, sourceDate: any) => {
	const year = currentDate.getFullYear();
	return new Date(sourceDate.setYear(year));
};

/**
 * 获取时间戳
 * 兼容Date对象和date字符串
 * @param date Date对象或date字符串（'2020/01/12')
 * @returns number
 */
export const getTimeStamp = (date: any) => (date.getTime ? date.getTime() : new Date(date).getTime());

/**
 * 判断前者（dateA）是否在后者（dateB）之前
 * @param dateA ~
 * @param dateB ~
 * @returns boolean ~
 */
export const isBefore = (dateA: any, dateB: any) => {
	return getTimeStamp(dateA) < getTimeStamp(dateB);
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
