import type { ExtractPropTypes } from 'vue';

export const props = {
	tag: {
		type: String,
		default: 'div'
	},
	label: String,
	labelWidth: {
		type: [String, Number],
		default: ''
	},
	extra: String,
	arrow: {
		type: [String, Boolean],
		default: 'right',
	},
	// 多行
	multiple: {
		type: Boolean,
		default: false
	},
	indent: {
		type: Number,
		default: 12
	},

	// 跳转的地址
	to: [String, Object, Function],
	// 跳转的地址
	href: String,

	// MListItem是否独立存在
	alone: Boolean
};
export type Props = ExtractPropTypes<typeof props>;