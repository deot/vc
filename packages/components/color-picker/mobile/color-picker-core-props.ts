import type { ExtractPropTypes } from 'vue';
import { pick } from 'lodash-es';
import { props as pickerPopupProps } from '../../picker/mobile/picker-popup-props';
import { pickerCoreProps } from '../../picker/mobile/use-picker-portal';
import { props as viewProps } from './color-picker-view-props';

const popupKeys = [
	'title',
	'cancelText',
	'okText'
] as const;

export const props = {
	...(pick(pickerPopupProps, popupKeys) as Pick<typeof pickerPopupProps, typeof popupKeys[number]>),
	...viewProps,
	// 由「确定」提交（默认，拖动选色需要确认）：true / 'top' 为顶部的「取消 / 确定」；'bottom' 为底部的「清空 / 确定」按钮
	// false：拖动色板、色条、输入色值或清空即提交，弹层保持打开；点预设色提交并关闭
	confirm: pickerPopupProps.confirm,
	...pickerCoreProps
};

export type Props = ExtractPropTypes<typeof props>;
