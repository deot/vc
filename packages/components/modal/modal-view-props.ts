import type { ExtractPropTypes, PropType } from 'vue';
import type { Props as CustomerProps } from '../customer/customer-props';
import type { Props as ScrollerProps } from '../scroller/scroller-props';

export const props = {
	modelValue: {
		type: Boolean,
		default: false
	},
	mode: {
		type: String as PropType<'info' | 'success' | 'error' | 'warning'>,
		validator: (v: string) => /(info|success|error|warning)/.test(v),
	},
	content: {
		type: [String, Function] as PropType<string | CustomerProps['render']>,
		default: ''
	},
	size: {
		type: String as PropType<'small' | 'medium' | 'large'>,
		validator: (v: string) => /(small|medium|large)/.test(v),
		default: 'small'
	},
	contentStyle: [Object, String],
	contentClass: [Object, String],
	width: {
		type: Number
	},
	// 数字为固定高度；'auto' 时高度跟随内容（不使用 size 预设的最小高度）；不传时以 size 预设的高度为最小高度
	height: {
		type: [Number, String] as PropType<number | 'auto'>
	},
	mask: {
		type: Boolean,
		default: true,
	},
	closable: {
		type: Boolean,
		default: true,
	},
	maskClosable: {
		type: Boolean,
		default: true
	},
	escClosable: {
		type: Boolean,
		default: true
	},
	closeWithCancel: {
		type: Boolean,
		default: true // 如果关闭, cancel只能是取消的按钮
	},
	title: {
		type: [String, Function] as PropType<string | CustomerProps['render']>,
	},
	// 内容区由内置的 Scroller 滚动；为 false 时内容区不滚动，由内容自行收缩并滚动
	scrollable: {
		type: Boolean,
		default: true
	},
	// 内置 Scroller 的属性
	scrollerOptions: Object as PropType<Partial<ScrollerProps>>,
	draggable: {
		type: Boolean,
		default: false
	},
	// draggable为true时有效
	x: Number,
	y: Number,
	okText: {
		type: [String, Boolean],
		default: undefined
	},
	cancelText: {
		type: [String, Boolean],
		default: undefined
	},
	wrapperStyle: [String, Object],
	wrapperClass: [String, Object],

	footer: {
		type: Boolean,
		default: true
	},
	border: {
		type: Boolean,
		default: false
	},

	okDisabled: {
		type: Boolean,
		default: false
	},
	cancelDisabled: {
		type: Boolean,
		default: false
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
