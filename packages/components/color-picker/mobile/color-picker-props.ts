import { omit, pick } from 'lodash-es';
import type { ExtractPropTypes, PropType } from 'vue';
import { props as listItemProps } from '../../list/mobile/list-item-props';
import { props as coreProps } from './color-picker-core-props';
import { pickerTriggerProps } from '../../picker/mobile/use-picker-portal';

const listItemKeys = [
	'label',
	'labelWidth',
	'arrow'
] as const;

// 弹层的 visible、回调由 MColorPicker 自己管理
export const coreOmitKeys = ['visible', 'onOk', 'onCancel'] as const;

export const props = {
	...(pick(listItemProps, listItemKeys) as Pick<typeof listItemProps, typeof listItemKeys[number]>),
	...(omit(coreProps, coreOmitKeys) as Omit<typeof coreProps, typeof coreOmitKeys[number]>),
	disabled: {
		type: Boolean,
		default: false
	},
	// 只读文字与没有值时的文字
	...pickerTriggerProps,
	// 根据色值生成色块旁的文字
	formatter: {
		type: Function as PropType<(value: string) => any>,
		default: (value: string) => value
	}
};

export type Props = ExtractPropTypes<typeof props>;
