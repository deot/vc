import type { ExtractPropTypes, PropType } from 'vue';

export const props = {
	type: {
		type: String,
		default: 'time',
		validator: (v: string) => /(time|timerange)/.test(v)
	},
	disabledTime: {
		type: Function as PropType<(date: Date) => boolean>,
		default: () => false
	},
	disabledHours: {
		type: Array as PropType<number[]>,
		default: () => {
			return [];
		}
	},
	disabledMinutes: {
		type: Array as PropType<number[]>,
		default: () => {
			return [];
		}
	},
	disabledSeconds: {
		type: Array as PropType<number[]>,
		default: () => {
			return [];
		}
	},
	filterable: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;
