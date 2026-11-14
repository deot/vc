import { omit, pick } from 'lodash-es';
import type { ExtractPropTypes, PropType } from 'vue';
import { props as pickerPopupProps } from '../../picker/mobile/picker-popup-props';
import { props as selectViewProps } from './select-view-props';

const popupKeys = [
	'title',
	'cancelText',
	'okText'
] as const;

// allowDispatch：弹层内由外层负责表单校验，不对外
const viewOmitKeys = ['allowDispatch'] as const;

export const props = {
	...(pick(pickerPopupProps, popupKeys) as Pick<typeof pickerPopupProps, typeof popupKeys[number]>),
	...(omit(selectViewProps, viewOmitKeys) as Omit<typeof selectViewProps, typeof viewOmitKeys[number]>),
	// 由「确定」提交：false 时单选点一项即提交并关闭；true / 'top' 为顶部的「取消 / 确定」；'bottom' 为底部的「清空 / 确定」按钮
	// 多选总是需要确定，为 false 时按 'top'
	confirm: {
		...pickerPopupProps.confirm,
		default: false
	},
	visible: {
		type: Boolean,
		default: true
	},
	onOk: Function as PropType<(value: any, labels: string[]) => void>,
	onCancel: Function as PropType<() => void>
};

export type Props = ExtractPropTypes<typeof props>;
