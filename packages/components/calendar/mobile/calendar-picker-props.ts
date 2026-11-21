import { pick } from 'lodash-es';
import type { ExtractPropTypes, PropType } from 'vue';
import { props as listItemProps } from '../../list/mobile/list-item-props';
import { props as pickerPopupProps } from '../../picker/mobile/picker-popup-props';
import { props as viewProps } from './calendar-picker-view-props';

const listItemKeys = [
	'label',
	'labelWidth',
	'arrow'
] as const;

const popupKeys = [
	'title',
	'cancelText',
	'okText'
] as const;

export const props = {
	...(pick(listItemProps, listItemKeys) as Pick<typeof listItemProps, typeof listItemKeys[number]>),
	...(pick(pickerPopupProps, popupKeys) as Pick<typeof pickerPopupProps, typeof popupKeys[number]>),
	...viewProps,
	confirm: {
		...pickerPopupProps.confirm,
		default: 'bottom'
	},
	// 没有值时的文字，缺省为「请选择」
	extra: String,
	// 区间起止之间的分隔符（显示文字）
	separator: {
		type: String,
		default: ' - '
	},
	// 自定义显示文字；返回空值时使用默认文字
	formatter: Function as PropType<(value: any) => any>
};

export type Props = ExtractPropTypes<typeof props>;
