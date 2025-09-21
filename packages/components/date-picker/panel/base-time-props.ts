import type { ExtractPropTypes, PropType } from 'vue';

export const props = {
	// 面板内的value统一为数组格式
	value: Array as PropType<Date[]>,
	format: String,
	disabledTime: {
		type: Function,
		default: () => false
	},
	confirm: {
		type: Boolean,
		default: false
	},
	steps: {
		type: Array,
		default: () => []
	},
	disabledHours: {
		type: Array,
		default() {
			return [];
		}
	},
	disabledMinutes: {
		type: Array,
		default() {
			return [];
		}
	},
	disabledSeconds: {
		type: Array,
		default() {
			return [];
		}
	},
	filterable: {
		type: Boolean,
		default: false
	},
};
export type Props = ExtractPropTypes<typeof props>;
