import type { ExtractPropTypes } from 'vue';
import { pick } from 'lodash-es';
import { props as selectProps } from '../select-props';

// 与桌面端同名同义：值的形状与转换、数据（带 children 的为分组）、单选 / 多选与数量上限、清空、搜索占位、选项文字
const selectKeys = [
	'modelValue',
	'data',
	'max',
	'separator',
	'numerable',
	'nullValue',
	'clearable',
	'searchPlaceholder',
	'renderLabel'
] as const;

export const props = {
	...(pick(selectProps, selectKeys) as Pick<typeof selectProps, typeof selectKeys[number]>),
	// 列表上方显示搜索框，按选项文字匹配，规则同桌面端
	searchable: {
		type: Boolean,
		default: false
	},
	// 提交时触发表单校验；在弹层内使用时为 false，由外层负责
	allowDispatch: {
		type: Boolean,
		default: true
	}
};

export type Props = ExtractPropTypes<typeof props>;
