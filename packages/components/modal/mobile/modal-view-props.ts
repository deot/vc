import type { ExtractPropTypes, PropType } from 'vue';
import type { Props as CustomerProps } from '../../customer/customer-props';

export const props = {
	mode: {
		type: String as PropType<'alert' | 'operation'>,
		validator: v => /(alert|operation)/.test(v),
		default: 'alert'
	},
	// false 不显示头部
	content: {
		type: [String, Function, Boolean] as PropType<boolean | string | CustomerProps['render']>
	},

	width: {
		type: Number,
		default: 270
	},
	modelValue: {
		type: Boolean,
		default: false
	},
	mask: {
		type: Boolean,
		default: true,
	},
	maskClosable: {
		type: Boolean,
		default: true
	},
	closeWithCancel: {
		type: Boolean,
		default: true // 如果关闭, cancel只能是取消的按钮
	},
	title: [String, Boolean], // false 不显示头部
	okText: {
		type: [String, Boolean],
		default: '确定'
	},
	cancelText: {
		type: [String, Boolean],
		default: '取消'
	},
	styles: {
		type: Object
	},
	footer: {
		type: Boolean,
		default: true
	},

	/**
	 * 兼容portal设计, 实现Promise方式
	 */
	actions: Array,
	onOk: {
		type: Function
	},
	onCancel: {
		type: Function
	}
};
export type Props = ExtractPropTypes<typeof props>;
