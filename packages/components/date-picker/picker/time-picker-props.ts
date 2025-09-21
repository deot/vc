import type { ExtractPropTypes } from 'vue';

export const props = {
	type: {
		type: String,
		default: 'time',
		validator: (v: string) => /(time|timerange)/.test(v)
	},
	disabledTime: {
		type: Function,
		default: () => false
	},
	disabledHours: {
		type: Array,
		default: () => {
			return [];
		}
	},
	disabledMinutes: {
		type: Array,
		default: () => {
			return [];
		}
	},
	disabledSeconds: {
		type: Array,
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
