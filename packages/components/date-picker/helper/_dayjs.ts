/**
 * dayjs 的最小子集：只有组件用到的 API，签名与结果都与 dayjs（en 语言 + customParseFormat 插件）一致
 * 	- 只经 ./dayjs 使用；以后改为依赖 dayjs 时，只换 ./dayjs 里的 import，并删除这个文件
 * 	- 与 dayjs 的一致性由 __tests__/dayjs.spec.ts 的对照测试保证（dayjs 只是开发依赖）
 * 	- dayjs 的怪行为也照搬（如 dayjs(undefined) 为现在），组件自己的处理放在 ./utils
 * 	- 需要更多 API 时按 dayjs 补上，并在对照测试里加上对应的用例
 * 	- 移植自 dayjs（MIT）：https://github.com/iamkun/dayjs
 */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = MONTHS.map(month => month.slice(0, 3));
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const FORMAT_DEFAULT = 'YYYY-MM-DDTHH:mm:ssZ';

const REGEX_PARSE = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/;
const REGEX_FORMAT = /\[([^\]]+)]|YYYY|YY|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g;

export type AddUnit = 'd' | 'day' | 'days' | 'w' | 'week' | 'weeks' | 'M' | 'month' | 'months' | 'y' | 'year' | 'years';
export type StartOfUnit = 'day' | 'month' | 'year';
export type ConfigType = string | number | Date | Dayjs | null | undefined;

const ADD_UNITS: Record<AddUnit, 'day' | 'week' | 'month' | 'year'> = {
	d: 'day',
	day: 'day',
	days: 'day',
	w: 'week',
	week: 'week',
	weeks: 'week',
	M: 'month',
	month: 'month',
	months: 'month',
	y: 'year',
	year: 'year',
	years: 'year'
};

const padStart = (value: number, length: number) => {
	const text = String(value);
	return text.length >= length ? text : '0'.repeat(length - text.length) + text;
};

// dayjs 的月末：new Date(y, M + 1, 0)（公元 0 ~ 99 年按 1900 ~ 1999 年算，与 dayjs 相同）
const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

const parseDate = (date: Exclude<ConfigType, Dayjs>) => {
	if (date === null) return new Date(NaN);
	if (date === undefined) return new Date();
	if (date instanceof Date) return new Date(date);
	if (typeof date === 'string' && !/Z$/i.test(date)) {
		const match = date.match(REGEX_PARSE);
		if (match) {
			const ms = (match[7] || '0').substring(0, 3);
			return new Date(+match[1], (+match[2] - 1) || 0, +(match[3] || 1), +(match[4] || 0), +(match[5] || 0), +(match[6] || 0), +ms);
		}
	}
	return new Date(date);
};

/* ----------------------------- customParseFormat ----------------------------- */

interface ParsedTime {
	year?: number;
	month?: number;
	day?: number;
	hours?: number;
	minutes?: number;
	seconds?: number;
	milliseconds?: number;
	afternoon?: boolean;
	zone?: number;
}

type Expression = [RegExp, (time: ParsedTime, input: string) => void];

const LOCALIZED_TOKENS = /(\[[^\]]+])|(LTS?|l{1,4}|L{1,4})/g;
const FORMATTING_TOKENS = /(\[[^[]*\])|([-_:/.,()\s]+)|(A|a|Q|YYYY|YY?|ww?|MM?M?M?|Do|DD?|hh?|HH?|mm?|ss?|S{1,3}|z|ZZ?)/g;
const match1 = /\d/;
const match2 = /\d\d/;
const match3 = /\d{3}/;
const match4 = /\d{4}/;
const match1to2 = /\d\d?/;
const matchSigned = /[+-]?\d+/;
const matchOffset = /[+-]\d\d:?(\d\d)?|Z/;
const matchWord = /\d*[^-_:/,()\s\d]+/;

const addInput = (property: keyof ParsedTime) => (time: ParsedTime, input: string) => {
	(time as any)[property] = +input;
};

const offsetFromString = (text: string) => {
	if (!text || text === 'Z') return 0;
	const parts = text.match(/([+-]|\d\d)/g)!;
	const minutes = +parts[1] * 60 + (+parts[2] || 0);
	return minutes === 0 ? 0 : parts[0] === '+' ? -minutes : minutes;
};

const zoneExpression: Expression = [matchOffset, (time, input) => {
	time.zone = offsetFromString(input);
}];

const matchMonth = (names: string[]) => (time: ParsedTime, input: string) => {
	const index = names.indexOf(input) + 1;
	if (index < 1) throw new Error();
	time.month = index % 12 || index;
};

const EXPRESSIONS: Record<string, Expression> = {
	A: [matchWord, (time, input) => {
		time.afternoon = input === 'PM';
	}],
	a: [matchWord, (time, input) => {
		time.afternoon = input === 'pm';
	}],
	Q: [match1, (time, input) => {
		time.month = (+input - 1) * 3 + 1;
	}],
	S: [match1, (time, input) => {
		time.milliseconds = +input * 100;
	}],
	SS: [match2, (time, input) => {
		time.milliseconds = +input * 10;
	}],
	SSS: [match3, addInput('milliseconds')],
	s: [match1to2, addInput('seconds')],
	ss: [match1to2, addInput('seconds')],
	m: [match1to2, addInput('minutes')],
	mm: [match1to2, addInput('minutes')],
	H: [match1to2, addInput('hours')],
	h: [match1to2, addInput('hours')],
	HH: [match1to2, addInput('hours')],
	hh: [match1to2, addInput('hours')],
	D: [match1to2, addInput('day')],
	DD: [match2, addInput('day')],
	Do: [matchWord, (time, input) => {
		time.day = +input.match(/\d+/)![0];
	}],
	M: [match1to2, addInput('month')],
	MM: [match2, addInput('month')],
	MMM: [matchWord, matchMonth(MONTHS_SHORT)],
	MMMM: [matchWord, matchMonth(MONTHS)],
	Y: [matchSigned, addInput('year')],
	YY: [match2, (time, input) => {
		const year = +input;
		time.year = year + (year > 68 ? 1900 : 2000);
	}],
	YYYY: [match4, addInput('year')],
	Z: zoneExpression,
	ZZ: zoneExpression
};

// 格式 -> 分词结果；null 表示含本地化格式（L、LT…），en 下 dayjs 会抛错，结果为 Invalid Date
const tokensCache = new Map<string, Array<Expression | string> | null>();
const getTokens = (format: string) => {
	if (!tokensCache.has(format)) {
		let localized = false;
		format.replace(LOCALIZED_TOKENS, (all, literal) => {
			localized ||= !literal;
			return all;
		});
		const tokens = format.match(FORMATTING_TOKENS);
		tokensCache.set(
			format,
			localized || !tokens ? null : tokens.map((token): Expression | string => EXPRESSIONS[token] || token.replace(/^\[|\]$/g, ''))
		);
	}
	return tokensCache.get(format);
};

const parseFormattedInput = (input: any, format: string) => {
	try {
		if (format === 'x' || format === 'X') return new Date((format === 'X' ? 1000 : 1) * input);

		const tokens = getTokens(format);
		if (!tokens) return new Date(NaN);

		const time: ParsedTime = {};
		let text: string = input;
		for (let i = 0, start = 0; i < tokens.length; i++) {
			const token = tokens[i];
			if (typeof token === 'string') {
				start += token.length;
			} else {
				const value = token[0].exec(text.slice(start))![0];
				token[1](time, value);
				text = text.replace(value, '');
			}
		}

		if (time.afternoon !== undefined) {
			if (time.afternoon) {
				time.hours! < 12 && (time.hours! += 12);
			} else if (time.hours === 12) {
				time.hours = 0;
			}
		}

		const { year, month, day, hours = 0, minutes = 0, seconds = 0, milliseconds = 0, zone } = time;
		const now = year && month && day ? null : new Date();
		const d = day || (!year && !month ? now!.getDate() : 1);
		const y = year || now!.getFullYear();
		const M = year && !month ? 0 : month! > 0 ? month! - 1 : now!.getMonth();

		if (zone !== undefined) return new Date(Date.UTC(y, M, d, hours, minutes, seconds, milliseconds + zone * 60 * 1000));
		return new Date(y, M, d, hours, minutes, seconds, milliseconds);
	} catch {
		return new Date(NaN);
	}
};

/* ----------------------------------- Dayjs ----------------------------------- */

const getZone = (date: Date, separator: string) => {
	const offset = -Math.round(date.getTimezoneOffset() / 15) * 15;
	const minutes = Math.abs(offset);
	return `${offset >= 0 ? '+' : '-'}${padStart(Math.floor(minutes / 60), 2)}${separator}${padStart(minutes % 60, 2)}`;
};

const formatToken = (date: Dayjs, token: string): string | number => {
	const { $H } = date;
	switch (token) {
		case 'YY': return String(date.$y).slice(-2);
		case 'YYYY': return padStart(date.$y, 4);
		case 'M': return date.$M + 1;
		case 'MM': return padStart(date.$M + 1, 2);
		case 'MMM': return MONTHS_SHORT[date.$M];
		case 'MMMM': return MONTHS[date.$M];
		case 'D': return date.$D;
		case 'DD': return padStart(date.$D, 2);
		case 'd': return String(date.$W);
		case 'dd': return WEEKDAYS[date.$W].slice(0, 2);
		case 'ddd': return WEEKDAYS[date.$W].slice(0, 3);
		case 'dddd': return WEEKDAYS[date.$W];
		case 'H': return String($H);
		case 'HH': return padStart($H, 2);
		case 'h': return String($H % 12 || 12);
		case 'hh': return padStart($H % 12 || 12, 2);
		case 'a': return $H < 12 ? 'am' : 'pm';
		case 'A': return $H < 12 ? 'AM' : 'PM';
		case 'm': return String(date.$m);
		case 'mm': return padStart(date.$m, 2);
		case 's': return String(date.$s);
		case 'ss': return padStart(date.$s, 2);
		case 'SSS': return padStart(date.$ms, 3);
		case 'Z': return getZone(date.$d, ':');
		// ZZ 及 dayjs 不认识的标记都输出 ZZ
		default: return getZone(date.$d, '');
	}
};

export class Dayjs {
	$d: Date;
	$y: number;
	$M: number;
	$D: number;
	$W: number;
	$H: number;
	$m: number;
	$s: number;
	$ms: number;

	// date 由 Dayjs 独占，调用方不能再修改它
	constructor(date: Date) {
		this.$d = date;
		this.$y = date.getFullYear();
		this.$M = date.getMonth();
		this.$D = date.getDate();
		this.$W = date.getDay();
		this.$H = date.getHours();
		this.$m = date.getMinutes();
		this.$s = date.getSeconds();
		this.$ms = date.getMilliseconds();
	}

	isValid() {
		return !isNaN(this.$d.getTime());
	}

	valueOf() {
		return this.$d.getTime();
	}

	toDate() {
		return new Date(this.$d.getTime());
	}

	startOf(unit: StartOfUnit) {
		if (unit === 'year') return new Dayjs(new Date(this.$y, 0, 1));
		if (unit === 'month') return new Dayjs(new Date(this.$y, this.$M, 1));
		const date = this.toDate();
		date.setHours(0, 0, 0, 0);
		return new Dayjs(date);
	}

	add(value: number, units: AddUnit) {
		const amount = Number(value);
		const unit = ADD_UNITS[units];
		const date = this.toDate();
		if (unit === 'month' || unit === 'year') {
			// 先到 1 日再换月 / 年，日超出新月份的天数时取月末
			date.setDate(1);
			if (unit === 'month') {
				date.setMonth(this.$M + amount);
			} else {
				date.setFullYear(this.$y + amount);
			}
			date.setDate(Math.min(this.$D, daysInMonth(date)));
		} else if (unit) {
			date.setDate(this.$D + Math.round((unit === 'week' ? 7 : 1) * amount));
		} else {
			date.setTime(date.getTime() + amount);
		}
		return new Dayjs(date);
	}

	subtract(value: number, units: AddUnit) {
		return this.add(value * -1, units);
	}

	format(template?: string) {
		if (!this.isValid()) return 'Invalid Date';
		return (template || FORMAT_DEFAULT).replace(REGEX_FORMAT, (match, literal) => literal || String(formatToken(this, match)));
	}
}

/**
 * 同 dayjs(date) / dayjs(text, format)（customParseFormat）
 * @param date ~
 * @param format ~
 * @returns ~
 */
export const dayjs = (date?: ConfigType, format?: string): Dayjs => {
	if (date instanceof Dayjs) return new Dayjs(date.toDate());
	return new Dayjs(typeof format === 'string' ? parseFormattedInput(date, format) : parseDate(date));
};

export default dayjs;
