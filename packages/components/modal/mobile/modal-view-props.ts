import type { ExtractPropTypes, PropType } from 'vue';
import { valueOrBooleanType } from '../../customer/customer-props';

export const props = {
	mode: {
		type: String as PropType<'alert' | 'operation'>,
		validator: v => /(alert|operation)/.test(v),
		default: 'alert'
	},
	// false 不显示头部
	content: {
		type: valueOrBooleanType
	},

	// 750 稿长度；不传时取样式默认值
	width: Number,
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
	title: {
		type: valueOrBooleanType,
	}, // false 不显示头部
	okText: {
		type: [String, Boolean],
		default: undefined
	},
	cancelText: {
		type: [String, Boolean],
		default: undefined
	},
	// 外层（铺满视口、居中弹窗）的类名与样式
	wrapperClass: [Object, Array, String],
	wrapperStyle: [Object, Array, String],
	// 内容区（.vcm-modal__content）的类名与样式，如 contentStyle="text-align: left" 让正文左对齐
	contentClass: [Object, Array, String],
	contentStyle: [Object, Array, String],
	footer: {
		type: Boolean,
		default: true
	},

	/**
	 * 按钮列表，不传时为取消、确定两个按钮
	 * 每项：content、style、onClick（返回 Promise 时等待其结束再关闭），disabled 为 true 时置灰、点击无效
	 */
	data: Array,
	onOk: {
		type: Function
	},
	onCancel: {
		type: Function
	}
};
export type Props = ExtractPropTypes<typeof props>;
