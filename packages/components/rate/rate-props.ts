import type { ExtractPropTypes } from 'vue';

export const props = {
	modelValue: {
		type: [Number, String],
		default: 0
	},
	// 星星的数量
	count: {
		type: Number,
		default: 5
	},
	color: {
		type: String,
		default: '#16a3ff'
	},
	icon: {
		type: String,
		default: 'star'
	},
	// 自定义的字符串
	character: String,
	half: {
		type: Boolean,
		default: false
	},
	clearable: {
		type: Boolean,
		default: false
	},
	disabled: {
		type: Boolean,
		default: false
	},
	// 每项的提示
	tooltip: {
		type: Array,
		default: () => ([])
	},
	iconStyle: {
		type: Object,
		default: () => ({})
	}
};
export type Props = ExtractPropTypes<typeof props>;
