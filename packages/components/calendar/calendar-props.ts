import type { ExtractPropTypes, PropType } from 'vue';
import { DEFAULT_YEAR_RANGE } from './utils';
import type { CalendarAdjacentWeeks, CalendarMode, CalendarType } from './types';

const isDayOfWeek = (value: number) => Number.isInteger(value) && value >= 1 && value <= 7;

/**
 * Calendar、MCalendar 与 MCalendarPicker 的选择相关属性
 * 值的格式与 DatePicker 相同：单选为按 format 格式化的字符串；daterange 与 multiple 为数组
 */
export const selectionProps = {
	modelValue: [Date, String, Array] as PropType<Date | string | Array<Date | string>>,
	type: {
		type: String as PropType<CalendarType>,
		default: 'date',
		validator: (value: string) => ['date', 'daterange'].includes(value)
	},
	// 多选；只在 type 为 date 时生效
	multiple: Boolean,
	format: {
		type: String,
		default: 'YYYY-MM-DD'
	},
	nullValue: {
		type: [String, Number, Object],
		default: ''
	},
	disabledDate: Function as PropType<(date: Date) => boolean>,
	// [起年, 止年]：范围外的日期禁用，翻页到边界停住
	yearRange: {
		type: Array as PropType<number[]>,
		default: () => DEFAULT_YEAR_RANGE
	},
	// 缺省读取全局 Calendar.firstDayOfWeek，仍缺省为 7
	firstDayOfWeek: {
		type: Number,
		validator: isDayOfWeek
	},
	// 日期下方显示节日、节气或农历日（仅 zh-CN）
	lunar: Boolean
};

export const props = {
	...selectionProps,
	// 纯展示：不可点选，仍发出 date-click
	readonly: Boolean,
	// 当前显示的月份，支持 v-model:panelDate；缺省为值所在的月份或本月
	panelDate: Date,
	mode: {
		type: String as PropType<CalendarMode>,
		default: 'month',
		validator: (value: string) => ['month', 'year'].includes(value)
	},
	showAdjacentWeeks: {
		type: [Boolean, Array] as PropType<CalendarAdjacentWeeks>,
		default: () => [false, true],
		validator: (value: CalendarAdjacentWeeks) => {
			return typeof value === 'boolean'
				|| (Array.isArray(value) && value.length === 2 && value.every(item => typeof item === 'boolean'));
		}
	}
};

export type SelectionProps = ExtractPropTypes<typeof selectionProps>;
export type Props = ExtractPropTypes<typeof props>;
