import { pick } from 'lodash-es';
import type { ExtractPropTypes, PropType } from 'vue';
import { props as pickerPopupProps } from '../../picker/mobile/picker-popup-props';
import { props as cascaderViewProps } from './cascader-view-props';

const popupKeys = [
	'title',
	'cancelText',
	'okText'
] as const;

export const props = {
	...(pick(pickerPopupProps, popupKeys) as Pick<typeof pickerPopupProps, typeof popupKeys[number]>),
	...cascaderViewProps,
	// 选到最后一级时不自动提交，由「确定」提交；为 true 或开启 changeOnSelect 时显示工具栏
	confirm: {
		type: Boolean,
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
