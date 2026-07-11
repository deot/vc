import type { ExtractPropTypes, PropType } from 'vue';
import { SUPPORTED_TYPES, type MDatePickerType } from './utils';

export const props = {
	modelValue: [Date, Array, String] as PropType<Date | Date[] | string | string[]>,
	type: {
		type: String as PropType<MDatePickerType>,
		default: 'datetime',
		validator: (value: string) => SUPPORTED_TYPES.includes(value as MDatePickerType)
	},
	format: String,
	minDate: {
		type: Date,
		default: () => new Date('1940/01/01 00:00')
	},
	maxDate: {
		type: Date,
		default: () => {
			const now = new Date();
			return new Date(now.setFullYear(now.getFullYear() + 50));
		}
	},
	startHour: {
		type: Number,
		default: 0
	},
	endHour: {
		type: Number,
		default: 23
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
