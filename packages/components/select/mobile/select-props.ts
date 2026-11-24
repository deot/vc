import { omit, pick } from 'lodash-es';
import type { ExtractPropTypes } from 'vue';
import { props as listItemProps } from '../../list/mobile/list-item-props';
import { props as coreProps } from './select-core-props';
import { pickerTriggerProps } from '../../picker/mobile/use-picker-portal';
import { props as selectProps } from '../select-props';

const listItemKeys = [
	'label',
	'labelWidth',
	'arrow'
] as const;

// 弹层的 visible、回调与已选项的文字由 MSelect 自己管理
export const coreOmitKeys = ['visible', 'onOk', 'onCancel', 'selectedLabels'] as const;

export const props = {
	...(pick(listItemProps, listItemKeys) as Pick<typeof listItemProps, typeof listItemKeys[number]>),
	...(omit(coreProps, coreOmitKeys) as Omit<typeof coreProps, typeof coreOmitKeys[number]>),
	disabled: {
		type: Boolean,
		default: false
	},
	// 只读文字与没有值时的文字
	...pickerTriggerProps,
	// 根据选中项的文字生成显示内容
	formatter: selectProps.formatter
};

export type Props = ExtractPropTypes<typeof props>;
