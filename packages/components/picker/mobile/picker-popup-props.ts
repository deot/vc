import type { ExtractPropTypes, PropType } from 'vue';
import { valueType } from '../../customer/customer-props';

export type PickerConfirm = boolean | 'top' | 'bottom';

/**
 * 按钮的位置：true 同 'top'
 * @param confirm ~
 * @returns 'top' | 'bottom' | false
 */
export const getConfirmMode = (confirm: PickerConfirm): 'top' | 'bottom' | false => {
	if (confirm === 'bottom') return 'bottom';
	return confirm ? 'top' : false;
};

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
	/**
	 * 「确定」的位置
	 * - true / 'top'：顶部的「取消 / 确定」工具栏
	 * - 'bottom'：底部的「确定」大按钮（footer 插槽可替换），标题与关闭按钮放在 MPopup 的标题栏
	 * - false：没有按钮，标题与关闭按钮放在 MPopup 的标题栏
	 */
	confirm: {
		type: [Boolean, String] as PropType<PickerConfirm>,
		default: true,
		validator: (v: any) => typeof v === 'boolean' || ['top', 'bottom'].includes(v)
	}
};

export type Props = ExtractPropTypes<typeof props>;
