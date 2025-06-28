import type { ExtractPropTypes, PropType } from 'vue';
import type { Props as CustomerProps } from '../customer/customer-props';

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
	height: {
		type: Number
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
	title: String,
	scrollable: {
		type: Boolean,
		default: false
	},
	draggable: {
		type: Boolean,
		default: false
	},
	// draggable为true时有效
	x: Number,
	y: Number,
	okText: {
		type: [String, Boolean],
		default: '确定'
	},
	cancelText: {
		type: [String, Boolean],
		default: '取消'
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
