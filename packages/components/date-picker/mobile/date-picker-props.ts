import { pick } from 'lodash-es';
import type { ExtractPropTypes, PropType } from 'vue';
import { props as listItemProps } from '../../list/mobile/list-item-props';
import { props as pickerPopupProps } from '../../picker/mobile/picker-popup-props';
import { props as viewProps } from './date-picker-view-props';

const listItemKeys = [
	'label',
	'labelWidth',
	'arrow'
] as const;

const popupKeys = [
	'title',
	'cancelText',
	'okText',
	'confirm'
] as const;

const viewKeys = [
	'modelValue',
	'type',
	'format',
	'disabledDate',
	'timePickerOptions',
	'steps',
	'yearRange',
	'virtualized',
	'separator',
	'nullValue'
] as const;

export const props = {
	...(pick(listItemProps, listItemKeys) as Pick<typeof listItemProps, typeof listItemKeys[number]>),
	...(pick(pickerPopupProps, popupKeys) as Pick<typeof pickerPopupProps, typeof popupKeys[number]>),
	...(pick(viewProps, viewKeys) as Pick<typeof viewProps, typeof viewKeys[number]>),
	cancelText: String,
	okText: String,
	// 只显示值格式化后的文字（经 formatter），不渲染 MListItem 与弹层：没有样式，不能交互，同桌面端
	plaintext: {
		type: Boolean,
		default: false
	},
	// 没有值时显示的文字，默认为当前语言的 vc.DatePicker.placeholder；plaintext 时默认为空
	extra: String,
	formatter: Function as PropType<(value: any, format: string, dates: Date[]) => any>
};

export type Props = ExtractPropTypes<typeof props>;
