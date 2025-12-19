import type { ExtractPropTypes } from 'vue';

export const props = {
	tag: {
		type: String,
		default: 'span'
	},
	value: [Number, String],
	placeholder: String,
	precision: {
		type: Number,
		default: 0
	},
	duration: {
		type: Number,
		default: 500
	},
	decimal: {
		type: String,
		default: '.'
	},
	separator: {
		type: String,
		default: ','
	},
	numerals: {
		type: Array as () => string[],
		default: () => []
	},
	smartEasingThreshold: {
		type: Number,
		default: 999
	},
	smartEasingAmount: {
		type: Number,
		default: 333
	},
	easing: {
		type: [Function, Boolean],
		default: true
	},

	// 10.90 -> 10.9
	zeroless: {
		type: Boolean,
		default: false
	},

	// 为true时，自行管理start/update
	controllable: {
		type: Boolean,
		default: false
	},
	render: Function
};
export type Props = ExtractPropTypes<typeof props>;
