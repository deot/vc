import type { ExtractPropTypes, PropType } from 'vue';

export const props = {
	// 面板内的value统一为数组格式
	value: Array as PropType<Date[]>,
	format: String,
	disabledDate: {
		type: Function,
		default: () => false
	},
	shortcuts: {
		type: Array,
		default: () => ([])
	},
	startDate: Date,
	focusedDate: [Date, Array],
	showTime: {
		type: Boolean,
		default: false
	},
	timePickerOptions: {
		type: Object,
		default: () => ({})
	}
};
export type Props = ExtractPropTypes<typeof props>;
