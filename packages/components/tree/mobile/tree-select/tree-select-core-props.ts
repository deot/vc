import { pick } from 'lodash-es';
import type { ExtractPropTypes } from 'vue';
import { props as pickerPopupProps } from '../../../picker/mobile/picker-popup-props';
import { pickerCoreProps } from '../../../picker/mobile/use-picker-portal';
import { props as treeSelectProps } from '../../tree-select/tree-select-props';

const popupKeys = [
	'title',
	'cancelText',
	'okText'
] as const;

// 与桌面端同名同义：值的形状与转换、数据、勾选数量与回填方式、清空、搜索占位、节点文字、虚拟化
const treeSelectKeys = [
	'modelValue',
	'data',
	'max',
	'checkStrategy',
	'separator',
	'numerable',
	'nullValue',
	'clearable',
	'searchPlaceholder',
	'renderNodeLabel',
	'virtualized'
] as const;

export const props = {
	...(pick(pickerPopupProps, popupKeys) as Pick<typeof pickerPopupProps, typeof popupKeys[number]>),
	...(pick(treeSelectProps, treeSelectKeys) as Pick<typeof treeSelectProps, typeof treeSelectKeys[number]>),
	// 树上方显示搜索框，按节点文字匹配，命中节点的祖先自动展开，规则同桌面端
	searchable: {
		type: Boolean,
		default: false
	},
	// 由「确定」提交：false 时单选点一个节点即提交并关闭；true / 'top' 为顶部的「取消 / 确定」；'bottom' 为底部的「清空 / 确定」按钮
	// 多选总是需要确定，为 false 时按 'top'
	confirm: {
		...pickerPopupProps.confirm,
		default: false
	},
	...pickerCoreProps
};

export type Props = ExtractPropTypes<typeof props>;
