import { preZero } from '@deot/helper-utils';
import { DEFAULT_FORMATS } from '../constants';
import type { Translator } from '../../locale';
import {
	TYPE_VALUE_RESOLVER_MAP,
	formatDate,
	getQuarter,
	isEmpty,
	isValidDate,
	value2Array
} from '../helper/utils';
import { findEnabledIndex } from '../../picker/mobile/utils';
import type { PickerColumn, PickerData, PickerValue } from '../../picker/types';

/**
 * 移动端日期选择的纯函数：列的生成与禁用、值的解析与格式化；MDatePickerView 与弹层共用
 *
 * 选中值在内部表示为「点」：单值为 [date]，范围为 [start, end]；季度取季度的第一天
 */

export type MDatePickerType = 'year'
	| 'month'
	| 'quarter'
	| 'date'
	| 'datetime'
	| 'time'
	| 'daterange'
	| 'datetimerange'
	| 'monthrange'
	| 'quarterrange'
	| 'timerange';

export type PickerUnit = 'Y' | 'Q' | 'M' | 'D' | 'H' | 'm' | 's';

export interface TimePickerOptions {
	disabledTime?: (date: Date) => boolean;
	disabledHours?: number[];
	disabledMinutes?: number[];
	disabledSeconds?: number[];
	// 隐藏被禁用的时、分、秒（默认置灰）
	filterable?: boolean;
	steps?: number[];
}

export interface DateContext {
	type: MDatePickerType;
	format: string;
	disabledDate?: (date: Date) => boolean;
	timePickerOptions: TimePickerOptions;
	// [时, 分, 秒] 的步长
	steps: number[];
	yearRange: number[];
	separator: string;
	t?: Translator;
}

export const SUPPORTED_TYPES: MDatePickerType[] = [
	'year',
	'month',
	'quarter',
	'date',
	'datetime',
	'time',
	'daterange',
	'datetimerange',
	'monthrange',
	'quarterrange',
	'timerange'
];

export const DEFAULT_YEAR_RANGE = [1900, 2100];

const FORMAT_MAP: Record<string, string> = {
	...DEFAULT_FORMATS,
	quarter: DEFAULT_FORMATS.date,
	quarterrange: DEFAULT_FORMATS.date
};

const UNIT_LABEL_MAP: Record<PickerUnit, string> = {
	Y: 'year',
	Q: 'quarter',
	M: 'month',
	D: 'day',
	H: 'hour',
	m: 'minute',
	s: 'second'
};

const QUARTER_NAMES = ['first', 'second', 'third', 'fourth'];
const TIME_UNITS: PickerUnit[] = ['H', 'm', 's'];

export const isRangeType = (type: string) => /range$/.test(type);

// 范围类对应的单值类型：daterange → date
export const getBaseType = (type: string) => type.replace(/range$/, '');

export const getEffectiveFormat = (type: string, format?: string) => {
	return format || FORMAT_MAP[type] || DEFAULT_FORMATS.date;
};

const getResolver = (type: string) => {
	return TYPE_VALUE_RESOLVER_MAP[type] || TYPE_VALUE_RESOLVER_MAP.default;
};

/**
 * 由 props 组成计算用的上下文
 * @param props 组件属性
 * @param t 翻译函数，用于列的文字；只做计算时可省略
 * @returns ~
 */
export const createContext = (props: Record<string, any>, t?: Translator): DateContext => {
	const type = (SUPPORTED_TYPES.includes(props.type) ? props.type : 'datetime') as MDatePickerType;
	const timePickerOptions = props.timePickerOptions || {};
	const steps = props.steps?.length ? props.steps : (timePickerOptions.steps || []);
	return {
		type,
		format: getEffectiveFormat(type, props.format),
		disabledDate: typeof props.disabledDate === 'function' ? props.disabledDate : void 0,
		timePickerOptions,
		steps: [0, 1, 2].map(i => Math.abs(Number(steps[i])) || 1),
		yearRange: props.yearRange || DEFAULT_YEAR_RANGE,
		separator: props.separator ?? ' - ',
		t
	};
};

/**
 * 各列的单位：时、分、秒有几列由 format 决定
 * @param type ~
 * @param format ~
 * @returns ~
 */
export const getPickerUnits = (type: string, format: string): PickerUnit[] => {
	const timeUnits = TIME_UNITS.filter(unit => new RegExp(unit === 'H' ? 'H' : `${unit}{1,2}`).test(format));
	const time = timeUnits.length ? timeUnits : TIME_UNITS;

	switch (getBaseType(type)) {
		case 'year':
			return ['Y'];
		case 'month':
			return ['Y', 'M'];
		case 'quarter':
			return ['Y', 'Q'];
		case 'date':
			return ['Y', 'M', 'D'];
		case 'time':
			return time;
		case 'datetime':
		default:
			return ['Y', 'M', 'D', ...time];
	}
};

/* ------------------------------ 禁用 ------------------------------ */

// 按 disabledDate 缓存「一段时间内每天都被禁用」的结果；函数变化后自然失效
const spanCache = new WeakMap<(date: Date) => boolean, Map<string, boolean>>();

/**
 * 一段时间内的每一天是否都被禁用：遇到第一个可选的日期就停止
 * @param start ~
 * @param end ~
 * @param disabledDate 按天判断，传入当天 0 点
 * @returns ~
 */
export const isSpanDisabled = (start: Date, end: Date, disabledDate: (date: Date) => boolean) => {
	let cache = spanCache.get(disabledDate);
	if (!cache) {
		cache = new Map();
		spanCache.set(disabledDate, cache);
	}
	const key = `${start.getTime()}-${end.getTime()}`;
	if (cache.has(key)) return cache.get(key)!;

	let result = true;
	const day = new Date(start.getFullYear(), start.getMonth(), start.getDate());
	while (day <= end) {
		if (!disabledDate(new Date(day))) {
			result = false;
			break;
		}
		day.setDate(day.getDate() + 1);
	}
	cache.set(key, result);
	return result;
};

type Parts = Record<PickerUnit, number>;

// 某一行覆盖的时间段：本列的值加上各上级列的值
const getSpan = (unit: PickerUnit, p: Parts): [Date, Date] => {
	switch (unit) {
		case 'Y':
			return [new Date(p.Y, 0, 1), new Date(p.Y, 11, 31, 23, 59, 59)];
		case 'Q':
			return [new Date(p.Y, (p.Q - 1) * 3, 1), new Date(p.Y, p.Q * 3, 0, 23, 59, 59)];
		case 'M':
			return [new Date(p.Y, p.M - 1, 1), new Date(p.Y, p.M, 0, 23, 59, 59)];
		case 'D':
			return [new Date(p.Y, p.M - 1, p.D), new Date(p.Y, p.M - 1, p.D, 23, 59, 59)];
		case 'H':
			return [new Date(p.Y, p.M - 1, p.D, p.H, 0, 0), new Date(p.Y, p.M - 1, p.D, p.H, 59, 59)];
		case 'm':
			return [new Date(p.Y, p.M - 1, p.D, p.H, p.m, 0), new Date(p.Y, p.M - 1, p.D, p.H, p.m, 59)];
		case 's':
		default: {
			const date = new Date(p.Y, p.M - 1, p.D, p.H, p.m, p.s);
			return [date, date];
		}
	}
};

/**
 * 某一行是否禁用
 * 	- 年、季度、月：其中每一天都被 disabledDate 禁用时禁用（可选的日期一定能滚到）
 * 	- 日：disabledDate(当天 0 点)
 * 	- 时、分、秒：与桌面端时间列相同，在禁用列表里，或 disabledTime 判断首尾两个时刻都禁用
 * 	- 范围的结束一侧：整段都早于开始值时禁用
 * @param ctx ~
 * @param unit ~
 * @param parts ~
 * @param bound 结束一侧的下限（开始值）
 * @returns ~
 */
const isRowDisabled = (ctx: DateContext, unit: PickerUnit, parts: Parts, bound?: Date) => {
	const [start, end] = getSpan(unit, parts);
	if (bound && end < bound) return true;

	const { disabledDate, timePickerOptions: options } = ctx;
	const { disabledTime } = options;
	switch (unit) {
		case 'Y':
		case 'Q':
		case 'M':
			return !!disabledDate && isSpanDisabled(start, end, disabledDate);
		case 'D':
			return !!disabledDate && !!disabledDate(start);
		case 'H':
			return !!options.disabledHours?.includes(parts.H)
				|| (typeof disabledTime === 'function' && !!disabledTime(start) && !!disabledTime(end));
		case 'm':
			return !!options.disabledMinutes?.includes(parts.m)
				|| (typeof disabledTime === 'function' && !!disabledTime(start) && !!disabledTime(end));
		case 's':
		default:
			return !!options.disabledSeconds?.includes(parts.s)
				|| (typeof disabledTime === 'function' && !!disabledTime(start));
	}
};

/* ------------------------------ 列 ------------------------------ */

const toPickerValue = (unit: PickerUnit, value: number) => {
	return unit === 'Y' || unit === 'Q' ? `${value}` : preZero(value);
};

// 日期的各部分（月为 1 ~ 12）
const getParts = (date: Date): Parts => ({
	Y: date.getFullYear(),
	Q: Number(getQuarter(date)),
	M: date.getMonth() + 1,
	D: date.getDate(),
	H: date.getHours(),
	m: date.getMinutes(),
	s: date.getSeconds()
});

const getRowRange = (ctx: DateContext, unit: PickerUnit, parts: Parts): number[] => {
	switch (unit) {
		case 'Y':
			return [ctx.yearRange[0], ctx.yearRange[1], 1];
		case 'Q':
			return [1, 4, 1];
		case 'M':
			return [1, 12, 1];
		case 'D':
			return [1, new Date(parts.Y, parts.M, 0).getDate(), 1];
		case 'H':
			return [0, 23, ctx.steps[0]];
		case 'm':
			return [0, 59, ctx.steps[1]];
		case 's':
		default:
			return [0, 59, ctx.steps[2]];
	}
};

const getRowLabel = (ctx: DateContext, unit: PickerUnit, value: number) => {
	const { t } = ctx;
	const text = toPickerValue(unit, value);
	if (!t) return text;
	return unit === 'Q'
		? t(`vc.DatePicker.quarter.${QUARTER_NAMES[value - 1]}` as any)
		: t(`vc.DatePicker.${UNIT_LABEL_MAP[unit]}` as any, { value: text });
};

/**
 * 某一列的数据：只依赖各上级列的值
 * @param ctx ~
 * @param unit ~
 * @param parts 各上级列的值；不在列里的部分取自基准日期
 * @param bound 结束一侧的下限
 * @returns ~
 */
const buildColumn = (ctx: DateContext, unit: PickerUnit, parts: Parts, bound?: Date): PickerColumn => {
	const [start, end, step] = getRowRange(ctx, unit, parts);
	const filterable = TIME_UNITS.includes(unit) && !!ctx.timePickerOptions.filterable;
	const column: PickerColumn = [];
	for (let value = start; value <= end; value += step) {
		const disabled = isRowDisabled(ctx, unit, { ...parts, [unit]: value }, bound);
		if (disabled && filterable) continue;
		column.push({ value: toPickerValue(unit, value), label: getRowLabel(ctx, unit, value), disabled });
	}
	return column;
};

// 列里与 value 对应的行：不在列里时取数值最近的行（如 31 日到小月、步长外的分钟），落在禁用行上时取最近的可选行
const resolveColumnRow = (column: PickerColumn, value: PickerValue): PickerData | undefined => {
	if (!column.length) return;
	let index = column.findIndex(row => row.value === value);
	if (index < 0) {
		const target = Number(value);
		index = column.reduce((best, row, i) => {
			return Math.abs(Number(row.value) - target) < Math.abs(Number(column[best].value) - target) ? i : best;
		}, 0);
	}
	const enabled = findEnabledIndex(column, index);
	return column[enabled >= 0 ? enabled : index];
};

/**
 * 由日期得到各列的值与数据：从上到下逐列生成，值不在列里或被禁用时换成最近的可选行
 * @param ctx ~
 * @param date 日期；没有时、分、秒列时取 0，没有年、月、日列时取自它
 * @param bound 范围结束一侧的下限
 * @returns ~
 */
export const resolveColumns = (ctx: DateContext, date: Date, bound?: Date) => {
	const units = getPickerUnits(ctx.type, ctx.format);
	const target = getParts(date);
	// 不在列里的部分取最小值：时、分、秒为 0（如 date 类型、无秒的 format），年、月类型的日为 1、年类型的月为 1；季度类型由季度推出月份
	const parts: Parts = { ...target };
	TIME_UNITS.forEach((unit) => {
		if (!units.includes(unit)) parts[unit] = 0;
	});
	if (units.includes('Y') && !units.includes('D')) parts.D = 1;
	if (units.includes('Y') && !units.includes('M') && !units.includes('Q')) parts.M = 1;

	const values: PickerValue[] = [];
	const columns: PickerColumn[] = [];
	units.forEach((unit) => {
		if (unit === 'Q') parts.M = (parts.Q - 1) * 3 + 1;
		const column = buildColumn(ctx, unit, parts, bound);
		const row = resolveColumnRow(column, toPickerValue(unit, parts[unit]));
		if (row) parts[unit] = Number(row.value);
		if (unit === 'Q') parts.M = (parts.Q - 1) * 3 + 1;
		// 换了年、月后，日超出当月天数时由下一列校正
		values.push(row?.value);
		columns.push(column);
	});

	return {
		values,
		columns,
		date: new Date(parts.Y, parts.M - 1, parts.D, parts.H, parts.m, parts.s)
	};
};

/**
 * 由各列的值得到日期
 * @param ctx ~
 * @param values 各列的值
 * @param base 基准日期：不在列里的部分取自它
 * @returns ~
 */
export const valuesToDate = (ctx: DateContext, values: PickerValue[], base: Date) => {
	const units = getPickerUnits(ctx.type, ctx.format);
	const parts = getParts(base);
	units.forEach((unit, index) => {
		const value = Number(values[index]);
		if (!isNaN(value)) parts[unit] = value;
	});
	if (units.includes('Q')) parts.M = (parts.Q - 1) * 3 + 1;
	return new Date(parts.Y, parts.M - 1, parts.D, parts.H, parts.m, parts.s);
};

/* ------------------------------ 值 ------------------------------ */

// 季度的最后一天
const getQuarterEnd = (date: Date) => {
	const quarter = Number(getQuarter(date));
	return new Date(date.getFullYear(), quarter * 3, 0);
};

/**
 * 解析 modelValue：与桌面端相同的格式（TYPE_VALUE_RESOLVER_MAP）
 * @param value ~
 * @param ctx ~
 * @returns 点：单值 [date]，范围 [start, end]；无效时为空数组
 */
export const parsePoints = (value: any, ctx: DateContext): Date[] => {
	if (isEmpty(value)) return [];
	// 单个 Date 对所有单值类型都有效（季度取其所在季度）
	if (value instanceof Date) return !isRangeType(ctx.type) && isValidDate(value) ? [value] : [];
	const resolver = getResolver(ctx.type) as any;
	let dates: Date[];
	try {
		dates = value2Array(resolver.parser(value, ctx.format, ctx.separator));
	} catch {
		return [];
	}
	dates = dates.filter(isValidDate);

	if (isRangeType(ctx.type)) return dates.length === 2 ? dates : [];
	// 季度为 [季度第一天, 最后一天]，只取第一天
	return dates.slice(0, 1);
};

/**
 * 解析并校正：没有值时取今天；落在禁用项上时换成最近的可选项；范围的结束不早于开始
 * @param value ~
 * @param ctx ~
 * @returns ~
 */
export const resolvePoints = (value: any, ctx: DateContext): Date[] => {
	const points = parsePoints(value, ctx);
	const start = resolveColumns(ctx, points[0] || new Date()).date;
	if (!isRangeType(ctx.type)) return [start];

	const end = points[1] && points[1] >= start ? points[1] : start;
	return [start, resolveColumns(ctx, end, start).date];
};

/**
 * 点 → modelValue，与桌面端格式相同：单值为字符串，季度与范围为数组
 * @param points ~
 * @param ctx ~
 * @param nullValue 没有值时返回
 * @returns ~
 */
export const formatPoints = (points: Date[], ctx: DateContext, nullValue: any = '') => {
	if (!points.length) return nullValue;
	const resolver = getResolver(ctx.type) as any;
	const baseType = getBaseType(ctx.type);

	if (isRangeType(ctx.type)) {
		const dates = baseType === 'quarter' ? [points[0], getQuarterEnd(points[1])] : points;
		return resolver.formatter(dates, ctx.format, ctx.separator);
	}
	if (baseType === 'quarter') {
		return resolver.formatter([points[0], getQuarterEnd(points[0])], ctx.format);
	}
	const value = resolver.formatter(points[0], ctx.format);
	return isEmpty(value) ? nullValue : value;
};

/**
 * 一个点的显示文字：季度为「2024年第一季度」，其余按 format
 * @param point ~
 * @param ctx ~
 * @returns ~
 */
export const formatPointText = (point: Date, ctx: DateContext) => {
	if (getBaseType(ctx.type) === 'quarter') {
		const quarter = QUARTER_NAMES[Number(getQuarter(point)) - 1];
		return ctx.t
			? ctx.t('vc.DatePicker.yearQuarter', { year: point.getFullYear(), quarter: ctx.t(`vc.DatePicker.quarter.${quarter}` as any) })
			: `${point.getFullYear()}-Q${getQuarter(point)}`;
	}
	return formatDate(point, ctx.format);
};

/**
 * 显示文字：范围用 separator 连接起止
 * @param points ~
 * @param ctx ~
 * @returns ~
 */
export const formatPointsText = (points: Date[], ctx: DateContext) => {
	return points.map(point => formatPointText(point, ctx)).join(ctx.separator);
};
