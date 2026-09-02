import type { CalendarFestival, CalendarFestivalType, CalendarHoliday } from './types';

// 1900-2100 年农历与节气编码表。原始编码需要保持紧凑，避免人工换行破坏数据。
/* eslint-disable @stylistic/max-len, @stylistic/quotes */
const yearBitTable = [43856, 19416, 19168, 42352, 21717, 53856, 55632, 25940, 22191, 39632, 21970, 19168, 42422, 42192, 53840, 53845, 46415, 54944, 44450, 38320, 18807, 18815, 42160, 46261, 27216, 27968, 43860, 11119, 38256, 21234, 18800, 25958, 54432, 59984, 27285, 23263, 11104, 34531, 37615, 51415, 51551, 54432, 55462, 46431, 22176, 42420, 9695, 37584, 53938, 43344, 46423, 27808, 46416, 21333, 19887, 42416, 17779, 21183, 43432, 59728, 27296, 44710, 43856, 19296, 43748, 42352, 21088, 62051, 55632, 23383, 22176, 38608, 19925, 19152, 42192, 54484, 53840, 54616, 46400, 46752, 38310, 38335, 18864, 43380, 42160, 45690, 27216, 27968, 44870, 43872, 38256, 19189, 18800, 25776, 29859, 59984, 27480, 23232, 43872, 38613, 37600, 51552, 55636, 54432, 55888, 30034, 22176, 43959, 9680, 37584, 51893, 43344, 46240, 47780, 44368, 21977, 19360, 42416, 20854, 21183, 43312, 31060, 27296, 44368, 23378, 19296, 42726, 42208, 53856, 60005, 54576, 23200, 30371, 38608, 19195, 19152, 42192, 53430, 53855, 54560, 56645, 46496, 22224, 21938, 18864, 42359, 42160, 43600, 45653, 27951, 44448, 19299, 37759, 18936, 18800, 25776, 26790, 59999, 27424, 42692, 43759, 37600, 53987, 51552, 54615, 54432, 55888, 23893, 22176, 42704, 21972, 21200, 43448, 43344, 46240, 46758, 44368, 21920, 43940, 42416, 21168, 45683, 26928, 29495, 27296, 44368, 19285, 19311, 42352, 21732, 53856, 59752, 54560, 55968, 27302, 22239, 19168, 43476, 42192, 53584, 62034, 54560];
const solarTermsTable = ["9778397bd097c36b0b6fc9274c91aa", "97b6b97bd19801ec9210c965cc920e", "97bcf97c3598082c95f8c965cc920f", "97bd0b06bdb0722c965ce1cfcc920f", "b027097bd097c36b0b6fc9274c91aa", "97b6b97bd19801ec9210c965cc920e", "97bcf97c359801ec95f8c965cc920f", "97bd0b06bdb0722c965ce1cfcc920f", "b027097bd097c36b0b6fc9274c91aa", "97b6b97bd19801ec9210c965cc920e", "97bcf97c359801ec95f8c965cc920f", "97bd0b06bdb0722c965ce1cfcc920f", "b027097bd097c36b0b6fc9274c91aa", "9778397bd19801ec9210c965cc920e", "97b6b97bd19801ec95f8c965cc920f", "97bd09801d98082c95f8e1cfcc920f", "97bd097bd097c36b0b6fc9210c8dc2", "9778397bd197c36c9210c9274c91aa", "97b6b97bd19801ec95f8c965cc920e", "97bd09801d98082c95f8e1cfcc920f", "97bd097bd097c36b0b6fc9210c8dc2", "9778397bd097c36c9210c9274c91aa", "97b6b97bd19801ec95f8c965cc920e", "97bcf97c3598082c95f8e1cfcc920f", "97bd097bd097c36b0b6fc9210c8dc2", "9778397bd097c36c9210c9274c91aa", "97b6b97bd19801ec9210c965cc920e", "97bcf97c3598082c95f8c965cc920f", "97bd097bd097c35b0b6fc920fb0722", "9778397bd097c36b0b6fc9274c91aa", "97b6b97bd19801ec9210c965cc920e", "97bcf97c3598082c95f8c965cc920f", "97bd097bd097c35b0b6fc920fb0722", "9778397bd097c36b0b6fc9274c91aa", "97b6b97bd19801ec9210c965cc920e", "97bcf97c359801ec95f8c965cc920f", "97bd097bd097c35b0b6fc920fb0722", "9778397bd097c36b0b6fc9274c91aa", "97b6b97bd19801ec9210c965cc920e", "97bcf97c359801ec95f8c965cc920f", "97bd097bd097c35b0b6fc920fb0722", "9778397bd097c36b0b6fc9274c91aa", "97b6b97bd19801ec9210c965cc920e", "97bcf97c359801ec95f8c965cc920f", "97bd097bd07f595b0b6fc920fb0722", "9778397bd097c36b0b6fc9210c8dc2", "9778397bd19801ec9210c9274c920e", "97b6b97bd19801ec95f8c965cc920f", "97bd07f5307f595b0b0bc920fb0722", "7f0e397bd097c36b0b6fc9210c8dc2", "9778397bd097c36c9210c9274c920e", "97b6b97bd19801ec95f8c965cc920f", "97bd07f5307f595b0b0bc920fb0722", "7f0e397bd097c36b0b6fc9210c8dc2", "9778397bd097c36c9210c9274c91aa", "97b6b97bd19801ec9210c965cc920e", "97bd07f1487f595b0b0bc920fb0722", "7f0e397bd097c36b0b6fc9210c8dc2", "9778397bd097c36b0b6fc9274c91aa", "97b6b97bd19801ec9210c965cc920e", "97bcf7f1487f595b0b0bb0b6fb0722", "7f0e397bd097c35b0b6fc920fb0722", "9778397bd097c36b0b6fc9274c91aa", "97b6b97bd19801ec9210c965cc920e", "97bcf7f1487f595b0b0bb0b6fb0722", "7f0e397bd097c35b0b6fc920fb0722", "9778397bd097c36b0b6fc9274c91aa", "97b6b97bd19801ec9210c965cc920e", "97bcf7f1487f531b0b0bb0b6fb0722", "7f0e397bd097c35b0b6fc920fb0722", "9778397bd097c36b0b6fc9274c91aa", "97b6b97bd19801ec9210c965cc920e", "97bcf7f1487f531b0b0bb0b6fb0722", "7f0e397bd07f595b0b6fc920fb0722", "9778397bd097c36b0b6fc9274c91aa", "97b6b97bd19801ec9210c9274c920e", "97bcf7f0e47f531b0b0bb0b6fb0722", "7f0e397bd07f595b0b0bc920fb0722", "9778397bd097c36b0b6fc9210c91aa", "97b6b97bd197c36c9210c9274c920e", "97bcf7f0e47f531b0b0bb0b6fb0722", "7f0e397bd07f595b0b0bc920fb0722", "9778397bd097c36b0b6fc9210c8dc2", "9778397bd097c36c9210c9274c920e", "97b6b7f0e47f531b0723b0b6fb0722", "7f0e37f5307f595b0b0bc920fb0722", "7f0e397bd097c36b0b6fc9210c8dc2", "9778397bd097c36b0b70c9274c91aa", "97b6b7f0e47f531b0723b0b6fb0721", "7f0e37f1487f595b0b0bb0b6fb0722", "7f0e397bd097c35b0b6fc9210c8dc2", "9778397bd097c36b0b6fc9274c91aa", "97b6b7f0e47f531b0723b0b6fb0721", "7f0e27f1487f595b0b0bb0b6fb0722", "7f0e397bd097c35b0b6fc920fb0722", "9778397bd097c36b0b6fc9274c91aa", "97b6b7f0e47f531b0723b0b6fb0721", "7f0e27f1487f531b0b0bb0b6fb0722", "7f0e397bd097c35b0b6fc920fb0722", "9778397bd097c36b0b6fc9274c91aa", "97b6b7f0e47f531b0723b0b6fb0721", "7f0e27f1487f531b0b0bb0b6fb0722", "7f0e397bd097c35b0b6fc920fb0722", "9778397bd097c36b0b6fc9274c91aa", "97b6b7f0e47f531b0723b0b6fb0721", "7f0e27f1487f531b0b0bb0b6fb0722", "7f0e397bd07f595b0b0bc920fb0722", "9778397bd097c36b0b6fc9274c91aa", "97b6b7f0e47f531b0723b0787b0721", "7f0e27f0e47f531b0b0bb0b6fb0722", "7f0e397bd07f595b0b0bc920fb0722", "9778397bd097c36b0b6fc9210c91aa", "97b6b7f0e47f149b0723b0787b0721", "7f0e27f0e47f531b0723b0b6fb0722", "7f0e397bd07f595b0b0bc920fb0722", "9778397bd097c36b0b6fc9210c8dc2", "977837f0e37f149b0723b0787b0721", "7f07e7f0e47f531b0723b0b6fb0722", "7f0e37f5307f595b0b0bc920fb0722", "7f0e397bd097c35b0b6fc9210c8dc2", "977837f0e37f14998082b0787b0721", "7f07e7f0e47f531b0723b0b6fb0721", "7f0e37f1487f595b0b0bb0b6fb0722", "7f0e397bd097c35b0b6fc9210c8dc2", "977837f0e37f14998082b0787b06bd", "7f07e7f0e47f531b0723b0b6fb0721", "7f0e27f1487f531b0b0bb0b6fb0722", "7f0e397bd097c35b0b6fc920fb0722", "977837f0e37f14998082b0787b06bd", "7f07e7f0e47f531b0723b0b6fb0721", "7f0e27f1487f531b0b0bb0b6fb0722", "7f0e397bd097c35b0b6fc920fb0722", "977837f0e37f14998082b0787b06bd", "7f07e7f0e47f531b0723b0b6fb0721", "7f0e27f1487f531b0b0bb0b6fb0722", "7f0e397bd07f595b0b0bc920fb0722", "977837f0e37f14998082b0787b06bd", "7f07e7f0e47f531b0723b0b6fb0721", "7f0e27f1487f531b0b0bb0b6fb0722", "7f0e397bd07f595b0b0bc920fb0722", "977837f0e37f14998082b0787b06bd", "7f07e7f0e47f149b0723b0787b0721", "7f0e27f0e47f531b0b0bb0b6fb0722", "7f0e397bd07f595b0b0bc920fb0722", "977837f0e37f14998082b0723b06bd", "7f07e7f0e37f149b0723b0787b0721", "7f0e27f0e47f531b0723b0b6fb0722", "7f0e397bd07f595b0b0bc920fb0722", "977837f0e37f14898082b0723b02d5", "7ec967f0e37f14998082b0787b0721", "7f07e7f0e47f531b0723b0b6fb0722", "7f0e37f1487f595b0b0bb0b6fb0722", "7f0e37f0e37f14898082b0723b02d5", "7ec967f0e37f14998082b0787b0721", "7f07e7f0e47f531b0723b0b6fb0722", "7f0e37f1487f531b0b0bb0b6fb0722", "7f0e37f0e37f14898082b0723b02d5", "7ec967f0e37f14998082b0787b06bd", "7f07e7f0e47f531b0723b0b6fb0721", "7f0e37f1487f531b0b0bb0b6fb0722", "7f0e37f0e37f14898082b072297c35", "7ec967f0e37f14998082b0787b06bd", "7f07e7f0e47f531b0723b0b6fb0721", "7f0e27f1487f531b0b0bb0b6fb0722", "7f0e37f0e37f14898082b072297c35", "7ec967f0e37f14998082b0787b06bd", "7f07e7f0e47f531b0723b0b6fb0721", "7f0e27f1487f531b0b0bb0b6fb0722", "7f0e37f0e366aa89801eb072297c35", "7ec967f0e37f14998082b0787b06bd", "7f07e7f0e47f149b0723b0787b0721", "7f0e27f1487f531b0b0bb0b6fb0722", "7f0e37f0e366aa89801eb072297c35", "7ec967f0e37f14998082b0723b06bd", "7f07e7f0e47f149b0723b0787b0721", "7f0e27f0e47f531b0723b0b6fb0722", "7f0e37f0e366aa89801eb072297c35", "7ec967f0e37f14998082b0723b06bd", "7f07e7f0e37f14998083b0787b0721", "7f0e27f0e47f531b0723b0b6fb0722", "7f0e37f0e366aa89801eb072297c35", "7ec967f0e37f14898082b0723b02d5", "7f07e7f0e37f14998082b0787b0721", "7f07e7f0e47f531b0723b0b6fb0722", "7f0e36665b66aa89801e9808297c35", "665f67f0e37f14898082b0723b02d5", "7ec967f0e37f14998082b0787b0721", "7f07e7f0e47f531b0723b0b6fb0722", "7f0e36665b66a449801e9808297c35", "665f67f0e37f14898082b0723b02d5", "7ec967f0e37f14998082b0787b06bd", "7f07e7f0e47f531b0723b0b6fb0721", "7f0e36665b66a449801e9808297c35", "665f67f0e37f14898082b072297c35", "7ec967f0e37f14998082b0787b06bd", "7f07e7f0e47f531b0723b0b6fb0721", "7f0e26665b66a449801e9808297c35", "665f67f0e37f1489801eb072297c35", "7ec967f0e37f14998082b0787b06bd", "7f07e7f0e47f531b0723b0b6fb0721", "7f0e27f1487f531b0b0bb0b6fb0722"];
const arrSolarTerms = ["小寒", "大寒", "立春", "雨水", "惊蛰", "春分", "清明", "谷雨", "立夏", "小满", "芒种", "夏至", "小暑", "大暑", "立秋", "处暑", "白露", "秋分", "寒露", "霜降", "立冬", "小雪", "大雪", "冬至"];
const heavenlyStems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const earthlyBranches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const chineseZodiac = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];
const lunarDayPrefixes = ["初", "十", "廿", "三十"];
const lunarDayDigits = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
const lunarMonthTitles = ["正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "腊"];
/* eslint-enable @stylistic/max-len, @stylistic/quotes */

const DAY_MS = 86400000;
const LUNAR_EPOCH_DAY = Date.UTC(1899, 1, 10) / DAY_MS;
const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

interface LunarInfo {
	lunarYear: number;
	lunarMonth: number;
	lunarDay: number;
	isLeap: boolean;
	isBigMonth: boolean;
}

interface FestivalDefinition {
	type: CalendarFestivalType;
	value: string;
	since?: number;
}

interface FestivalDefinitions {
	lunar: Record<string, FestivalDefinition>;
	fixed: Record<string, FestivalDefinition>;
	weekday: Record<string, FestivalDefinition>;
}

const festivalPriority: Record<CalendarFestivalType, number> = {
	a: 1,
	c: 2,
	h: 3,
	i: 4,
	t: 5
};

const festivalDefinitions: FestivalDefinitions = {
	lunar: {
		'0101': { type: 't', value: '春节' },
		'0115': { type: 't', value: '元宵节' },
		'0202': { type: 't', value: '龙头节' },
		'0505': { type: 't', value: '端午节' },
		'0707': { type: 't', value: '七夕节' },
		'0715': { type: 't', value: '中元节' },
		'0815': { type: 't', value: '中秋节' },
		'0909': { type: 't', value: '重阳节' },
		'1001': { type: 't', value: '寒衣节' },
		'1015': { type: 't', value: '下元节' },
		'1208': { type: 't', value: '腊八节' },
		'1223': { type: 't', value: '小年' }
	},
	fixed: {
		'0101': { type: 'h', value: '元旦' },
		'0202': { type: 'i', value: '湿地日', since: 1996 },
		'0214': { type: 'a', value: '情人节' },
		'0308': { type: 'i', value: '妇女节', since: 1975 },
		'0312': { type: 'h', value: '植树节', since: 1979 },
		'0401': { type: 'i', value: '愚人节', since: 1564 },
		'0422': { type: 'i', value: '地球日', since: 1990 },
		'0501': { type: 'i', value: '劳动节', since: 1889 },
		'0504': { type: 'h', value: '青年节', since: 1939 },
		'0512': { type: 'i', value: '护士节', since: 1912 },
		'0601': { type: 'h', value: '儿童节', since: 1950 },
		'0605': { type: 'i', value: '环境日', since: 1972 },
		'0701': { type: 'h', value: '建党节', since: 1941 },
		'0801': { type: 'h', value: '建军节', since: 1933 },
		'0910': { type: 'h', value: '教师节', since: 1985 },
		'1001': { type: 'h', value: '国庆节', since: 1949 },
		'1224': { type: 'c', value: '平安夜' },
		'1225': { type: 'c', value: '圣诞节' }
	},
	weekday: {
		'0520': { type: 'i', value: '母亲节', since: 1913 },
		'0630': { type: 'a', value: '父亲节' },
		'1144': { type: 'a', value: '感恩节' }
	}
};

const emptyHoliday = (): CalendarHoliday => {
	return {
		holiday: '',
		festivals: []
	};
};

const zeroPad = (value: number): string => {
	return String(value).padStart(2, '0');
};

class Date2HolidayManager {
	private yearDaysCache: Record<number, number> = {};

	get(dateString: string, lang: string): CalendarHoliday {
		if (lang !== 'zh-CN') return emptyHoliday();

		const date = this.parseDate(dateString);
		if (!date) return emptyHoliday();

		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();
		const firstTermIndex = (month - 1) * 2;
		const firstTermDate = this.getSolarTermDate(year, firstTermIndex);
		let solarTerm = '';

		if (day === firstTermDate.getDate()) {
			solarTerm = arrSolarTerms[firstTermIndex];
		} else {
			const secondTermIndex = firstTermIndex + 1;
			const secondTermDate = this.getSolarTermDate(year, secondTermIndex);
			if (day === secondTermDate.getDate()) {
				solarTerm = arrSolarTerms[secondTermIndex];
			}
		}

		const lunarInfo = this.getLunarInfo(date);
		const weekDay = date.getDay();
		const festivals = this.getFestivals(date, lunarInfo);

		return {
			animal: chineseZodiac[(lunarInfo.lunarYear - 4) % 12],
			gzDate: this.getGanzhiDay(date),
			gzMonth: this.getGanzhiMonth(date, year, month),
			gzYear: this.getGanzhiYear(year, lunarInfo.lunarYear),
			lunarYear: lunarInfo.lunarYear,
			lunarMonth: lunarInfo.lunarMonth,
			lunarDate: lunarInfo.lunarDay,
			lMonth: (lunarInfo.isLeap ? '闰' : '') + lunarMonthTitles[lunarInfo.lunarMonth - 1],
			lDate: this.getLunarDayText(lunarInfo.lunarDay),
			solarTerm,
			festivals,
			isBigMonth: lunarInfo.isBigMonth,
			oDate: date,
			weekDay,
			cnWeekDay: '日一二三四五六'.charAt(weekDay),
			holiday: festivals[0]?.value || solarTerm
		};
	}

	private parseDate(dateString: string): Date | undefined {
		const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
		if (!match) return undefined;

		const year = Number(match[1]);
		const month = Number(match[2]);
		const day = Number(match[3]);

		if (year < MIN_YEAR || year > MAX_YEAR) return undefined;

		const date = new Date(year, month - 1, day);
		return date.getFullYear() === year
			&& date.getMonth() === month - 1
			&& date.getDate() === day
			? date
			: undefined;
	}

	private getLunarInfo(date: Date): LunarInfo {
		let offset = this.getDayNumber(date) - LUNAR_EPOCH_DAY;
		let year = 1899;
		let yearDays = 0;

		while (year < MAX_YEAR && offset > 0) {
			yearDays = this.getYearDays(year);
			offset -= yearDays;
			year++;
		}

		if (offset < 0) {
			offset += yearDays;
			year--;
		}

		const lunarYear = year;
		const leapMonth = this.getLeapMonth(lunarYear);

		for (let lunarMonth = 1; lunarMonth <= 12; lunarMonth++) {
			const monthDays = this.getMonthDays(lunarYear, lunarMonth);
			if (offset < monthDays) {
				return {
					lunarYear,
					lunarMonth,
					lunarDay: offset + 1,
					isLeap: false,
					isBigMonth: monthDays === 30
				};
			}
			offset -= monthDays;

			if (lunarMonth === leapMonth) {
				const leapDays = this.getLeapDays(lunarYear);
				if (offset < leapDays) {
					return {
						lunarYear,
						lunarMonth,
						lunarDay: offset + 1,
						isLeap: true,
						isBigMonth: leapDays === 30
					};
				}
				offset -= leapDays;
			}
		}

		return {
			lunarYear,
			lunarMonth: 12,
			lunarDay: offset + 1,
			isLeap: false,
			isBigMonth: false
		};
	}

	private getYearDays(year: number): number {
		const cached = this.yearDaysCache[year];
		if (cached !== undefined) return cached;

		let days = 348;
		const yearData = yearBitTable[year - 1899];

		for (let mask = 32768; mask > 8; mask >>= 1) {
			days += mask & yearData ? 1 : 0;
		}

		days += this.getLeapDays(year);
		this.yearDaysCache[year] = days;

		return days;
	}

	private getLeapDays(year: number): number {
		if (!this.getLeapMonth(year)) return 0;

		return (yearBitTable[year - 1899 + 1] & 15) === 15 ? 30 : 29;
	}

	private getLeapMonth(year: number): number {
		const month = yearBitTable[year - 1899] & 15;
		return month === 15 ? 0 : month;
	}

	private getMonthDays(year: number, month: number): number {
		return yearBitTable[year - 1899] & (65536 >> month) ? 30 : 29;
	}

	private getSolarTermDate(year: number, termIndex: number): Date {
		const encodedYear = solarTermsTable[year - MIN_YEAR];
		const termDays: string[] = [];

		for (let offset = 0; offset < 30; offset += 5) {
			const decimal = Number.parseInt(encodedYear.slice(offset, offset + 5), 16).toString();
			termDays.push(
				decimal.slice(0, 1),
				decimal.slice(1, 3),
				decimal.slice(3, 4),
				decimal.slice(4, 6)
			);
		}

		return new Date(year, Math.floor(termIndex / 2), Number(termDays[termIndex]));
	}

	private getGanzhi(index: number): string {
		return heavenlyStems[index % 10] + earthlyBranches[index % 12];
	}

	private getGanzhiYear(gregorianYear: number, lunarYear: number): string {
		return this.getGanzhi(gregorianYear - MIN_YEAR + 36 - (lunarYear === gregorianYear ? 0 : 1));
	}

	private getGanzhiMonth(date: Date, year: number, month: number): string {
		const termDate = this.getSolarTermDate(year, date.getMonth() * 2);
		return this.getGanzhi(
			(year - MIN_YEAR) * 12 + month + 12 - (date.getTime() < termDate.getTime() ? 1 : 0)
		);
	}

	private getGanzhiDay(date: Date): string {
		return this.getGanzhi(this.getDayNumber(date) + 25567 + 10);
	}

	private getDayNumber(date: Date): number {
		return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS;
	}

	private getFestivals(date: Date, lunarInfo: LunarInfo): CalendarFestival[] {
		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();
		const week = Math.ceil(day / 7);
		const weekdayKey = zeroPad(month) + week + date.getDay();
		const fixedKey = zeroPad(month) + zeroPad(day);
		const lunarKey = zeroPad(lunarInfo.lunarMonth) + zeroPad(lunarInfo.lunarDay);
		const sources: Array<FestivalDefinition | undefined> = [];

		if (
			lunarInfo.lunarMonth === 12
			&& lunarInfo.lunarDay === (lunarInfo.isBigMonth ? 30 : 29)
		) {
			sources.push({ type: 't', value: '除夕' });
		}

		sources.push(
			festivalDefinitions.weekday[weekdayKey],
			festivalDefinitions.fixed[fixedKey],
			festivalDefinitions.lunar[lunarKey]
		);

		return sources
			.filter((item): item is FestivalDefinition => {
				return Boolean(item && (item.since === undefined || year >= item.since));
			})
			.map((item) => {
				return {
					type: item.type,
					desc: item.value,
					value: item.value
				};
			})
			.sort((first, second) => {
				return festivalPriority[second.type] - festivalPriority[first.type];
			});
	}

	private getLunarDayText(day: number): string {
		if (day % 10 === 0) {
			return ['初十', '二十', '三十'][day / 10 - 1] || '';
		}

		return lunarDayPrefixes[Math.floor(day / 10)] + lunarDayDigits[day % 10];
	}
}

export const Date2Holiday = new Date2HolidayManager();
