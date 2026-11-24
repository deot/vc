import { omit, pick } from 'lodash-es';
import type { ExtractPropTypes, PropType } from 'vue';
import { props as listItemProps } from '../../../list/mobile/list-item-props';
import { props as coreProps } from './tree-select-core-props';

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
	// 只显示已选项的文字（按 value 在 data 中查出 label，经 formatter），不渲染 MListItem 与弹层：没有样式，不能交互，同桌面端
	plaintext: {
		type: Boolean,
		default: false
	},
	// formatter 返回空值时显示的文字，默认为当前语言的 vc.TreeSelect.placeholder；plaintext 时默认为空
	extra: String,
	// 根据已选项的文字生成显示内容；联动时文字为完整路径（各级以 / 连接），同桌面端的标签
	formatter: {
		type: Function as PropType<(labels: string[], value: any) => any>,
		default: (labels: string[]) => labels.filter(Boolean).join(', ')
	}
};

export type Props = ExtractPropTypes<typeof props>;
