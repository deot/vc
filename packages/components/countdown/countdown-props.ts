import type { ExtractPropTypes } from 'vue';

export const props = {
	tag: {
		type: String,
		default: 'span'
	},
	// 只能是String, 函数使用formatter
	format: {
		type: String,
		default: 'DD天HH小时mm分ss秒SSS'
	},
	t: {
		type: Number,
		default: 1000
	},
	targetTime: {
		type: [String, Number, Date],
		default: ''
	},
	serverTime: {
		type: [String, Number, Date],
		default: ''
	},
	render: Function,

	// 仅当默认展示时有效
	// 当为false时：00天00小时29分10秒12 -> 29分10秒12
	trim: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;
