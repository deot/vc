import { omit, pick } from 'lodash-es';
import type { ExtractPropTypes, PropType } from 'vue';
import { props as listItemProps } from '../../list/mobile/list-item-props';
import { props as coreProps } from './color-picker-core-props';

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
	// 只显示 formatter 生成的色值文字，不渲染色块、MListItem 与弹层：没有样式，不能交互，同桌面端
	plaintext: {
		type: Boolean,
		default: false
	},
	// 未选择时显示的文字，默认为当前语言的 vc.ColorPicker.placeholder；plaintext 时默认为空
	extra: String,
	// 根据色值生成色块旁的文字
	formatter: {
		type: Function as PropType<(value: string) => any>,
		default: (value: string) => value
	}
};

export type Props = ExtractPropTypes<typeof props>;
