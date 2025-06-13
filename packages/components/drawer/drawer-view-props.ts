import type { ExtractPropTypes, PropType } from 'vue';
import type { Props as CustomerProps } from '../customer/customer-props';

export const props = {
	title: String,
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
		default: 300
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
	scrollable: {
		type: Boolean,
		default: false
	},
	placement: {
		type: String,
		default: 'right' // top/right/left/bottom
	},
	maskStyle: [Object, String],
	wrapperClass: [Object, String],
	wrapperStyle: [Object, String],
	closeWithCancel: {
		type: Boolean,
		default: true // 如果关闭, cancel只能是取消的按钮
	},
	okText: {
		type: [String, Boolean],
		default: '确定'
	},
	cancelText: {
		type: [String, Boolean],
		default: '取消'
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
