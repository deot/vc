import type { ExtractPropTypes } from 'vue';
import { valueType } from '../../customer/customer-props';

export const props = {
	tag: {
		type: String,
		default: 'div'
	},
	label: valueType,
	labelWidth: {
		type: [String, Number],
		default: ''
	},
	// label 下方的描述
	description: valueType,
	// 左侧图标：MIcon 的类型；icon 插槽优先
	icon: String,
	extra: valueType,
	arrow: {
		type: [String, Boolean],
		default: 'right',
	},
	// 多行
	multiple: {
		type: Boolean,
		default: false
	},
	// 根节点左内边距，750 稿长度；不传时取样式默认值
	indent: Number,

	// 跳转的地址
	to: [String, Object, Function],
	// 跳转的地址
	href: String,

	// MListItem是否独立存在
	alone: Boolean
};
export type Props = ExtractPropTypes<typeof props>;
