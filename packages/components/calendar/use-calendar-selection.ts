import { computed, inject, provide, ref, watch } from 'vue';
import type { ComputedRef, Ref, Slots } from 'vue';
import type { Scroller as ScrollerComponent } from '../scroller';
import {
	DEFAULT_FIRST_DAY_OF_WEEK,
	DEFAULT_YEAR_RANGE,
	formatDate,
	getDateTimestamp,
	isValidDate,
	parseDate,
	sortWeekdays,
	value2Array
} from '../date-picker/helper/utils';
import { useLocale } from '../locale';
import { VcInstance } from '../vc';
import { weekLocaleKeys } from './constants';
import type { SelectionProps } from './calendar-props';

export interface CalendarSelection {
	// 选中日期 0 点的时间戳（单选、多选；区间为起止两天）
	times: Set<number>;
	// 区间的起止（选择中为起点与悬停日期）；没有区间时为 NaN
	start: number;
	end: number;
}

/**
 * Calendar 与 MCalendarPicker 的月网格（CalendarMonth）共用的状态
 */
export interface CalendarContext {
	selection: ComputedRef<CalendarSelection>;
	weekdays: ComputedRef<string[]>;
	firstDayOfWeek: ComputedRef<number>;
	lang: Ref<string>;
	todayTime: number;
	slots: Slots;
	// 内容区的滚动容器（Scroller / MScroller）
	Scroller: typeof ScrollerComponent;
	isDisabled: (date: Date) => boolean;
	isReadonly: () => boolean;
	isLunar: () => boolean;
	// 格子上方显示「开始」、「结束」、「今天」（MCalendarPicker）
	marks: boolean;
	// 区间选择中按悬停预览（桌面端）
	hoverable: boolean;
	pick: (date: Date) => void;
	hover: (date: Date | null) => void;
}

export const CALENDAR_CONTEXT_KEY = Symbol('vc-calendar');

export const useCalendarContext = () => inject<CalendarContext>(CALENDAR_CONTEXT_KEY)!;

interface SelectionOptions {
	slots: Slots;
	Scroller: typeof ScrollerComponent;
	emit: (event: any, ...args: any[]) => void;
	marks?: boolean;
	hoverable?: boolean;
	isReadonly?: () => boolean;
	// 点中日期后（先于提交）：如切到该日期所在的月份
	onPick?: (date: Date) => void;
	// 提交了新值之后
	onChange?: (value: any) => void;
}

/**
 * 日期的选择：值的解析与格式化、单选 / 多选 / 区间、禁用、选择中的区间预览
 * 	- 区间第一次点选起点、第二次点选终点（早于起点时交换），选完才提交
 * 	- 多选再次点选取消
 * @param props ~
 * @param options ~
 * @returns ~
 */
export const useCalendarSelection = (props: SelectionProps, options: SelectionOptions) => {
	const { emit } = options;
	const { lang, t } = useLocale();
	const currentValue = ref<any>(props.modelValue);
	// 区间已选的起点（等待终点）
	const pending = ref<number>(NaN);
	const hovered = ref<number>(NaN);

	watch(
		() => props.modelValue,
		(v) => {
			currentValue.value = v;
			pending.value = NaN;
		}
	);

	const isRange = computed(() => props.type === 'daterange');
	const isMultiple = computed(() => props.multiple && !isRange.value);

	const firstDayOfWeek = computed(() => {
		return props.firstDayOfWeek ?? VcInstance.options.Calendar?.firstDayOfWeek ?? DEFAULT_FIRST_DAY_OF_WEEK;
	});

	const weekdays = computed(() => sortWeekdays(weekLocaleKeys.map(key => t(key)), firstDayOfWeek.value));

	// 值中的日期（已去掉时分秒）
	const dates = computed(() => {
		return value2Array(currentValue.value)
			.map((item: Date | string) => (item instanceof Date ? item : parseDate(item, props.format)))
			.filter((item: any) => isValidDate(item))
			.map((item: Date) => new Date(getDateTimestamp(item)));
	});

	const selection = computed<CalendarSelection>(() => {
		const times = new Set<number>();
		let start = NaN;
		let end = NaN;

		if (isRange.value) {
			if (!Number.isNaN(pending.value)) {
				const other = Number.isNaN(hovered.value) ? pending.value : hovered.value;
				start = Math.min(pending.value, other);
				end = Math.max(pending.value, other);
				times.add(pending.value);
			} else if (dates.value.length === 2) {
				start = Math.min(dates.value[0].getTime(), dates.value[1].getTime());
				end = Math.max(dates.value[0].getTime(), dates.value[1].getTime());
				times.add(start).add(end);
			}
		} else {
			(isMultiple.value ? dates.value : dates.value.slice(0, 1)).forEach(date => times.add(date.getTime()));
		}

		return { times, start, end };
	});

	const yearRange = computed(() => props.yearRange?.length === 2 ? props.yearRange : DEFAULT_YEAR_RANGE);

	const isDisabled = (date: Date) => {
		const year = date.getFullYear();
		return year < yearRange.value[0]
			|| year > yearRange.value[1]
			|| !!props.disabledDate?.(date);
	};

	const format = (date: Date) => formatDate(date, props.format);

	const toModelValue = (list: Date[]) => {
		if (isRange.value || isMultiple.value) return list.map(format);
		return (list[0] && format(list[0])) || props.nullValue;
	};

	const commit = (list: Date[]) => {
		const value = toModelValue(list);
		currentValue.value = value;
		emit('update:modelValue', value);
		emit('change', value);
		options.onChange?.(value);
	};

	const pick = (date: Date) => {
		if (isDisabled(date)) return;

		emit('date-click', { date, value: format(date) });
		if (options.isReadonly?.()) return;

		options.onPick?.(date);
		const time = date.getTime();
		if (isRange.value) {
			if (Number.isNaN(pending.value)) {
				pending.value = time;
				hovered.value = NaN;
				return;
			}
			const start = Math.min(pending.value, time);
			const end = Math.max(pending.value, time);
			pending.value = NaN;
			hovered.value = NaN;
			commit([new Date(start), new Date(end)]);
		} else if (isMultiple.value) {
			const exists = selection.value.times.has(time);
			commit(exists ? dates.value.filter(item => item.getTime() !== time) : [...dates.value, date]);
		} else {
			commit([date]);
		}
	};

	const hover = (date: Date | null) => {
		if (Number.isNaN(pending.value)) return;
		hovered.value = date ? date.getTime() : NaN;
	};

	const context: CalendarContext = {
		selection,
		weekdays,
		firstDayOfWeek,
		lang,
		todayTime: getDateTimestamp(new Date()),
		slots: options.slots,
		Scroller: options.Scroller,
		isDisabled,
		isReadonly: options.isReadonly || (() => false),
		isLunar: () => props.lunar,
		marks: !!options.marks,
		hoverable: !!options.hoverable,
		pick,
		hover
	};

	provide(CALENDAR_CONTEXT_KEY, context);

	return {
		context,
		dates,
		pending,
		isRange,
		isMultiple,
		yearRange,
		firstDayOfWeek,
		weekdays,
		currentValue
	};
};
