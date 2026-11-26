import { omit, pick } from 'lodash-es';
import type { ExtractPropTypes, PropType } from 'vue';
import { props as listItemProps } from '../../list/mobile/list-item-props';
import { props as coreProps } from './cascader-core-props';
import { pickerTriggerProps } from '../../picker/mobile/use-picker-portal';

const listItemKeys = [
	'label',
	'labelWidth',
	'arrow'
] as const;

// 弹层的 visible、回调由 MCascader 自己管理
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
	// 根据路径文字生成显示内容，同桌面端
	formatter: {
		type: Function as PropType<(labels: string[]) => any>,
		default: (labels: string[]) => (labels && labels.join(' / '))
	}
};

export type Props = ExtractPropTypes<typeof props>;
