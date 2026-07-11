import { preZero } from '@deot/helper-utils';
import { DEFAULT_FORMATS, QUARTER_CN } from '../constants';
import {
	TYPE_VALUE_RESOLVER_MAP,
	getMonthEndDay,
	getQuarter,
	isEmpty,
	value2Array
} from '../helper/utils';
import type { PickerColumn, PickerValue } from '../../picker/types';

export type MDatePickerType = 'datetime' | 'date' | 'time' | 'yearmonth' | 'year' | 'month' | 'quarter';
export type PickerUnit = 'Y' | 'M' | 'D' | 'H' | 'm' | 's' | 'Q';

export const SUPPORTED_TYPES: MDatePickerType[] = [
	'datetime',
	'date',
	'time',
	'yearmonth',
	'year',
	'month',
	'quarter'
];

const FORMAT_MAP: Record<string, string> = {
	...DEFAULT_FORMATS,
	yearmonth: DEFAULT_FORMATS.month,
	quarter: DEFAULT_FORMATS.date
};

const UNIT_LABEL_MAP: Record<PickerUnit, string> = {
	Y: '年',
	M: '月',
	D: '日',
	H: '时',
	m: '分',
	s: '秒',
	Q: '季度'
};

const normalizeType = (type?: string): MDatePickerType => {
	return SUPPORTED_TYPES.includes(type as MDatePickerType)
		? type as MDatePickerType
		: 'datetime';
};

export const getResolverType = (type?: string) => {
	const target = normalizeType(type);
	return target === 'yearmonth' ? 'month' : target;
};

export const getEffectiveFormat = (type?: string, format?: string) => {
	return format || FORMAT_MAP[normalizeType(type)] || DEFAULT_FORMATS.date;
};

export const getResolver = (type?: string) => {
	return TYPE_VALUE_RESOLVER_MAP[getResolverType(type)] || TYPE_VALUE_RESOLVER_MAP.default;
};

const hasToken = (format: string, token: 'H' | 'm' | 's') => {
	const map = {
		H: /H{1,2}/,
		m: /m{1,2}/,
		s: /s{1,2}/
	};
	return map[token].test(format);
};

const getTimeUnits = (format: string): PickerUnit[] => {
	const result: PickerUnit[] = [];
	if (hasToken(format, 'H')) result.push('H');
	if (hasToken(format, 'm')) result.push('m');
	if (hasToken(format, 's')) result.push('s');
	return result;
};

export const getPickerUnits = (type?: string, format?: string): PickerUnit[] => {
	const target = normalizeType(type);
	const currentFormat = getEffectiveFormat(target, format);
	const timeUnits = getTimeUnits(currentFormat);

	switch (target) {
		case 'year':
			return ['Y'];
		case 'month':
		case 'yearmonth':
			return ['Y', 'M'];
		case 'date':
			return ['Y', 'M', 'D'];
		case 'time':
			return timeUnits.length ? timeUnits : ['H', 'm', 's'];
		case 'quarter':
			return ['Y', 'Q'];
		case 'datetime':
		default:
			return ['Y', 'M', 'D', ...(timeUnits.length ? timeUnits : ['H', 'm', 's'] as PickerUnit[])];
	}
};

export const clampDate = (date: Date, minDate: Date, maxDate: Date) => {
	const time = date.getTime();
	if (time < minDate.getTime()) return new Date(minDate);
	if (time > maxDate.getTime()) return new Date(maxDate);
	return date;
};

export const getDefaultDate = (minDate: Date, maxDate: Date) => {
	return clampDate(new Date(), minDate, maxDate);
};

const isValidDate = (value: any): value is Date => {
	return value instanceof Date && !isNaN(value.getTime());
};

export const parseModelValueToDates = (
	value: any,
	type?: string,
	format?: string
) => {
	if (isEmpty(value)) return [];

	const resolver = getResolver(type) as any;
	const currentFormat = getEffectiveFormat(type, format);
	const parsed = resolver.parser(value, currentFormat);

	return value2Array(parsed).filter(isValidDate);
};

export const formatDatesToModelValue = (
	dates: Date[],
	type?: string,
	format?: string,
	nullValue: any = ''
) => {
	if (!dates.length) return nullValue;

	const resolver = getResolver(type) as any;
	const currentFormat = getEffectiveFormat(type, format);
	const target = getResolverType(type) === 'quarter' ? dates : dates[0];
	const value = resolver.formatter(target, currentFormat);

	return isEmpty(value) ? nullValue : value;
};

export const formatDatesToText = (
	dates: Date[],
	type?: string,
	format?: string
) => {
	if (!dates.length) return '';

	const resolver = getResolver(type) as any;
	const currentFormat = getEffectiveFormat(type, format);
	const target = getResolverType(type) === 'quarter' ? dates : dates[0];
	const formatter = resolver.formatterText || resolver.formatter;

	return formatter(target, currentFormat) || '';
};

export const getQuarterRange = (year: number, quarter: number) => {
	const startMonth = (quarter - 1) * 3;
	const endMonth = startMonth + 2;
	const endDay = getMonthEndDay(year, endMonth + 1);

	return [
		new Date(year, startMonth, 1),
		new Date(year, endMonth, endDay)
	];
};

export const dateToPickerValue = (
	date: Date,
	type?: string,
	format?: string
) => {
	const units = getPickerUnits(type, format);
	const source: Record<PickerUnit, string> = {
		Y: `${date.getFullYear()}`,
		M: preZero(date.getMonth() + 1),
		D: preZero(date.getDate()),
		H: preZero(date.getHours()),
		m: preZero(date.getMinutes()),
		s: preZero(date.getSeconds()),
		Q: getQuarter(date) || '1'
	};

	return units.map(unit => source[unit]);
};

const getNumberValue = (
	value: PickerValue | undefined,
	defaultValue: number
) => {
	const numberValue = Number(value);
	return isNaN(numberValue) ? defaultValue : numberValue;
};

export const pickerValueToDates = (
	value: PickerValue[],
	type: string | undefined,
	format: string | undefined,
	minDate: Date,
	maxDate: Date
) => {
	const units = getPickerUnits(type, format);
	const defaultDate = getDefaultDate(minDate, maxDate);
	const unitValue = (unit: PickerUnit) => value[units.indexOf(unit)];

	if (getResolverType(type) === 'quarter') {
		const year = getNumberValue(unitValue('Y'), defaultDate.getFullYear());
		const quarter = getNumberValue(unitValue('Q'), Number(getQuarter(defaultDate) || 1));
		return getQuarterRange(year, quarter);
	}

	const hasUnit = (unit: PickerUnit) => units.includes(unit);
	const year = hasUnit('Y')
		? getNumberValue(unitValue('Y'), defaultDate.getFullYear())
		: defaultDate.getFullYear();
	const month = hasUnit('M')
		? getNumberValue(unitValue('M'), defaultDate.getMonth() + 1)
		: 1;
	const maxDay = getMonthEndDay(year, month);
	const day = hasUnit('D')
		? Math.min(getNumberValue(unitValue('D'), defaultDate.getDate()), maxDay)
		: 1;
	const hour = hasUnit('H') ? getNumberValue(unitValue('H'), 0) : 0;
	const minute = hasUnit('m') ? getNumberValue(unitValue('m'), 0) : 0;
	const second = hasUnit('s') ? getNumberValue(unitValue('s'), 0) : 0;

	return [clampDate(new Date(year, month - 1, day, hour, minute, second), minDate, maxDate)];
};

export const makeColumn = (
	unit: PickerUnit,
	start: number,
	end: number
): PickerColumn => {
	return Array.from({ length: end - start + 1 }, (_, index) => {
		const current = start + index;
		const value = unit === 'Y' || unit === 'Q' ? `${current}` : preZero(current);
		const label = unit === 'Q'
			? `第${QUARTER_CN[current as keyof typeof QUARTER_CN]}${UNIT_LABEL_MAP[unit]}`
			: `${value}${UNIT_LABEL_MAP[unit]}`;

		return {
			value,
			label
		};
	});
};

export const normalizeModelValue = (
	value: any,
	type: string | undefined,
	format: string | undefined,
	minDate: Date,
	maxDate: Date,
	nullValue: any = '',
	force = false
) => {
	const dates = parseModelValueToDates(value, type, format);
	if (dates.length) {
		return formatDatesToModelValue(dates, type, format, nullValue);
	}

	if (!force) return value;

	const defaultDate = getDefaultDate(minDate, maxDate);
	const next = pickerValueToDates(
		dateToPickerValue(defaultDate, type, format),
		type,
		format,
		minDate,
		maxDate
	);

	return formatDatesToModelValue(next, type, format, nullValue);
};
