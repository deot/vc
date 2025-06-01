import type { ExtractPropTypes } from 'vue';
import { props as inputProps } from './input-props';

export const props = {
	...inputProps,
	min: {
		type: Number,
		default: 0,
	},
	max: {
		type: Number,
		default: Number.MAX_SAFE_INTEGER,
	},
	step: {
		type: [Number, Boolean],
		default: 1, // 为0时不展示
	},
	required: {
		type: Boolean,
		default: false
	},
	precision: {
		type: Number,
		default: 0,
	},

	output: {
		type: [Function, String],
		default: 'number'
	},

	// 清空值时返回的值
	nullValue: {
		type: [Number, String, Object],
		default: void 0
	}
};
export type Props = ExtractPropTypes<typeof props>;
