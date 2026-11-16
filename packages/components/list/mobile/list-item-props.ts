import type { ExtractPropTypes, PropType } from 'vue';
import { valueType } from '../../customer/customer-props';
import type { SwipeActionOptions, SwipeActionValue } from '../../swipe-action/mobile/swipe-action-props';

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
	alone: Boolean,

	// 滑动操作露出的一侧，支持 v-model:swiped；取值同 MSwipeAction 的 modelValue
	swiped: {
		type: [String, Boolean] as PropType<SwipeActionValue>,
		default: false
	},
	// 滑动操作的配置：MSwipeAction 除 modelValue 外的属性（leftActions、rightActions 等）
	swipeActionOptions: Object as PropType<SwipeActionOptions>
};
export type Props = ExtractPropTypes<typeof props>;
