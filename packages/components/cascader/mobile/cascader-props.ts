import { omit, pick } from 'lodash-es';
import type { ExtractPropTypes, PropType } from 'vue';
import { props as listItemProps } from '../../list/mobile/list-item-props';
import { props as coreProps } from './cascader-core-props';

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
	// 只显示当前值的路径文字（按 value 在 data 中查出 label，经 formatter），不渲染 MListItem 与弹层：没有样式，不能交互，同桌面端
	plaintext: {
		type: Boolean,
		default: false
	},
	// formatter 返回空值时显示的文字，默认为当前语言的 vc.Cascader.placeholder；plaintext 时默认为空
	extra: String,
	// 根据路径文字生成显示内容，同桌面端
	formatter: {
		type: Function as PropType<(labels: string[]) => any>,
		default: (labels: string[]) => (labels && labels.join(' / '))
	}
};

export type Props = ExtractPropTypes<typeof props>;
