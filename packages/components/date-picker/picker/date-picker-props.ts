import type { ExtractPropTypes } from 'vue';

export const props = {
	type: {
		type: String,
		default: 'date',
		validator: (v: string) => /(year|month|quarter|date|daterange|datetime|datetimerange|quarterrange|monthrange)/.test(v)
	},
	// 每周第一天，1 至 7 表示周一至周日；缺省读取全局 DatePicker.firstDayOfWeek，仍缺省为 7
	firstDayOfWeek: {
		type: Number,
		validator: (value: number) => Number.isInteger(value) && value >= 1 && value <= 7
	},
	disabledDate: Function,
	shortcuts: Array,
	timePickerOptions: {
		type: Object,
		default: () => ({})
	}
};
export type Props = ExtractPropTypes<typeof props>;
