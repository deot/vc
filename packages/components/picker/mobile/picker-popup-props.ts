import type { ExtractPropTypes, PropType } from 'vue';
import { valueType } from '../../customer/customer-props';

export const props = {
	modelValue: {
		type: Boolean,
		default: true
	},
	visible: {
		type: Boolean as PropType<boolean | undefined>,
		default: undefined
	},
	title: {
		type: valueType,
		default: ''
	},
	cancelText: String,
	okText: String,
	// 「取消」、「确定」置灰且不可点
	cancelDisabled: {
		type: Boolean,
		default: false
	},
	okDisabled: {
		type: Boolean,
		default: false
	},
	// 不显示工具栏时，标题与关闭按钮放在 MPopup 的标题栏
	showToolbar: {
		type: Boolean,
		default: true
	}
};

export type Props = ExtractPropTypes<typeof props>;
