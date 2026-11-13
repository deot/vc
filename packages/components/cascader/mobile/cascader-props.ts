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
	// formatter 返回空值时显示的文字，默认为当前语言的 vc.Cascader.placeholder
	extra: String,
	// 根据路径文字生成显示内容，同桌面端
	formatter: {
		type: Function as PropType<(labels: string[]) => any>,
		default: (labels: string[]) => (labels && labels.join(' / '))
	}
};

export type Props = ExtractPropTypes<typeof props>;
