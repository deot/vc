import type { ExtractPropTypes, PropType } from 'vue';
import { SUPPORTED_TYPES, DEFAULT_YEAR_RANGE, type MDatePickerType, type TimePickerOptions } from './utils';

export const props = {
	// 与桌面端相同：单值为格式化字符串；季度与范围类为数组
	modelValue: [Date, Array, String] as PropType<Date | Date[] | string | string[]>,
	type: {
		type: String as PropType<MDatePickerType>,
		default: 'datetime',
		validator: (value: string) => SUPPORTED_TYPES.includes(value as MDatePickerType)
	},
	format: String,
	// 按天判断是否禁用；年、季度、月中每一天都被禁用时该行禁用
	disabledDate: Function as PropType<(date: Date) => boolean>,
	// 时、分、秒的禁用，同桌面端：disabledTime、disabledHours、disabledMinutes、disabledSeconds、filterable
	timePickerOptions: {
		type: Object as PropType<TimePickerOptions>,
		default: () => ({})
	},
	// [时, 分, 秒] 的步长
	steps: {
		type: Array as PropType<number[]>,
		default: () => ([])
	},
	yearRange: {
		type: Array as PropType<number[]>,
		default: () => DEFAULT_YEAR_RANGE
	},
	// 范围的显示文字与字符串解析的分隔符
	separator: {
		type: String,
		default: ' - '
	},
	allowDispatch: {
		type: Boolean,
		default: true
	},
	nullValue: {
		type: [String, Number, Object],
		default: ''
	}
};

export type Props = ExtractPropTypes<typeof props>;
