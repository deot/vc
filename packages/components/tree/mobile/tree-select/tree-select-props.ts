import { omit, pick } from 'lodash-es';
import type { ExtractPropTypes } from 'vue';
import { props as listItemProps } from '../../../list/mobile/list-item-props';
import { props as coreProps } from './tree-select-core-props';
import { pickerTriggerProps } from '../../../picker/mobile/use-picker-portal';
import { props as selectProps } from '../../../select/select-props';

const listItemKeys = [
	'label',
	'labelWidth',
	'arrow'
] as const;

// 弹层的 visible、回调与已选值的路径由 MTreeSelect 自己管理
export const coreOmitKeys = ['visible', 'onOk', 'onCancel', 'selectedNodes'] as const;

export const props = {
	...(pick(listItemProps, listItemKeys) as Pick<typeof listItemProps, typeof listItemKeys[number]>),
	...(omit(coreProps, coreOmitKeys) as Omit<typeof coreProps, typeof coreOmitKeys[number]>),
	disabled: {
		type: Boolean,
		default: false
	},
	// 只读文字与没有值时的文字
	...pickerTriggerProps,
	// 根据已选项的文字生成显示内容；联动时文字为完整路径（各级以 / 连接），同桌面端的标签
	formatter: selectProps.formatter
};

export type Props = ExtractPropTypes<typeof props>;
