import type { ExtractPropTypes } from 'vue';
import { pick } from 'lodash-es';
import { props as cascaderProps } from '../cascader-props';
import { renderType } from '../../customer/customer-props';

// 与桌面端同名同义：值的形状与转换、数据、选择任意一级、加载子节点、搜索占位
const cascaderKeys = [
	'modelValue',
	'data',
	'changeOnSelect',
	'checkStrategy',
	'loadData',
	'searchPlaceholder',
	'separator',
	'numerable',
	'nullValue',
	'max'
] as const;

export const props = {
	...(pick(cascaderProps, cascaderKeys) as Pick<typeof cascaderProps, typeof cascaderKeys[number]>),
	// 标签栏右端显示「清空」（有选中路径时），清空后提交空值
	clearable: {
		type: Boolean,
		default: false
	},
	// 列表上方显示搜索框，按整条路径匹配
	searchable: {
		type: Boolean,
		default: false
	},
	// 待选那一级的标签文字，默认为当前语言的 vc.Cascader.placeholder
	placeholder: String,
	// 自定义选项内容，参数 { label, row, index, selected }；label 插槽优先
	renderLabel: renderType,
	// 提交时触发表单校验；在弹层内使用时为 false，由外层负责
	allowDispatch: {
		type: Boolean,
		default: true
	}
};

export type Props = ExtractPropTypes<typeof props>;
