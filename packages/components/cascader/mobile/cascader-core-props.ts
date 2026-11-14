import { pick } from 'lodash-es';
import type { ExtractPropTypes } from 'vue';
import { props as pickerPopupProps } from '../../picker/mobile/picker-popup-props';
import { pickerCoreProps } from '../../picker/mobile/use-picker-portal';
import { props as cascaderViewProps } from './cascader-view-props';

const popupKeys = [
	'title',
	'cancelText',
	'okText'
] as const;

export const props = {
	...(pick(pickerPopupProps, popupKeys) as Pick<typeof pickerPopupProps, typeof popupKeys[number]>),
	...cascaderViewProps,
	// 选到最后一级时不自动提交，由「确定」提交：true / 'top' 为顶部的「取消 / 确定」，'bottom' 为底部的「确定」按钮
	// 为 false 且开启 changeOnSelect 时按 'top'
	confirm: {
		...pickerPopupProps.confirm,
		default: false
	},
	...pickerCoreProps
};

export type Props = ExtractPropTypes<typeof props>;
