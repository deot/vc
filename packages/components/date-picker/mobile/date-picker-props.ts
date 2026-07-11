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
	'showToolbar'
] as const;

const viewKeys = [
	'modelValue',
	'type',
	'format',
	'minDate',
	'maxDate',
	'startHour',
	'endHour',
	'nullValue'
] as const;

export const props = {
	...(pick(listItemProps, listItemKeys) as Pick<typeof listItemProps, typeof listItemKeys[number]>),
	...(pick(pickerPopupProps, popupKeys) as Pick<typeof pickerPopupProps, typeof popupKeys[number]>),
	...(pick(viewProps, viewKeys) as Pick<typeof viewProps, typeof viewKeys[number]>),
	extra: {
		type: String,
		default: '请选择'
	},
	formatter: Function as PropType<(value: any, format: string, dates: Date[]) => any>
};

export type Props = ExtractPropTypes<typeof props>;
