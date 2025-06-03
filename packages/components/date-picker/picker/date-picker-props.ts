import type { ExtractPropTypes } from 'vue';

export const props = {
	type: {
		type: String,
		default: 'date',
		validator: (v: string) => /(year|month|quarter|date|daterange|datetime|datetimerange|quarterrange|monthrange)/.test(v)
	},
	options: {
		type: Object,
		default: () => ({})
	},
	timePickerOptions: {
		type: Object,
		default: () => ({})
	}
};
export type Props = ExtractPropTypes<typeof props>;
