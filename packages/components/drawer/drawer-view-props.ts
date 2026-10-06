import type { ExtractPropTypes, PropType } from 'vue';
import type { Props as CustomerProps } from '../customer/customer-props';
import type { Props as ScrollerProps } from '../scroller/scroller-props';

export const props = {
	title: [String, Boolean, Function] as PropType<string | boolean | CustomerProps['render']>,
	content: {
		type: [String, Function] as PropType<string | CustomerProps['render']>,
		default: ''
	},
	modelValue: {
		type: Boolean,
		default: false
	},
	width: {
		type: Number,
		default: 600
	},
	height: {
		type: Number,
		default: 300
	},
	mask: {
		type: Boolean,
		default: true
	},
	maskClosable: {
		type: Boolean,
		default: true
	},
	// 内容区由内置的 Scroller 滚动；为 false 时内容区不滚动，由内容自行收缩并滚动
	scrollable: {
		type: Boolean,
		default: true
	},
	// 内置 Scroller 的属性
	scrollerOptions: Object as PropType<Partial<ScrollerProps>>,
	placement: {
		type: String,
		default: 'right' // top/right/left/bottom
	},
	maskStyle: [Object, String],
	wrapperClass: [Object, String],
	wrapperStyle: [Object, String],
	contentStyle: [Object, String],
	contentClass: [Object, String],
	closeWithCancel: {
		type: Boolean,
		default: true // 如果关闭, cancel只能是取消的按钮
	},
	okText: {
		type: [String, Boolean],
		default: undefined
	},
	cancelText: {
		type: [String, Boolean],
		default: undefined
	},
	okDisabled: {
		type: Boolean,
		default: false
	},
	cancelDisabled: {
		type: Boolean,
		default: false
	},
	footer: {
		type: Boolean,
		default: true
	},

	/**
	 * 兼容portal设计, 实现Promise方式
	 */
	onOk: {
		type: Function
	},
	onCancel: {
		type: Function
	}
};
export type Props = ExtractPropTypes<typeof props>;
