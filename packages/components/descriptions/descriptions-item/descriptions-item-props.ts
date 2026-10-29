import type { ExtractPropTypes, PropType } from 'vue';
import { valueType } from '../../customer/customer-props';
import type { GridResponsive, GridSpan } from '../../grid/types';
import type { DescriptionsItemOption } from '../types';

// 只用于声明：DescriptionsItem不会挂载，Descriptions直接读vnode上的值并补默认值（type为text）
export const props = {
	label: valueType,
	/**
	 * 读取Descriptions的data的路径
	 */
	prop: String,
	/**
	 * 显式传值，优先于prop；函数作为渲染函数，参数为 { value, row, index, data }
	 */
	value: null,
	type: String,
	/**
	 * 覆盖Descriptions的span
	 */
	span: [Number, String, Object] as PropType<GridResponsive<GridSpan>>,
	tooltip: [String, Function, Object] as PropType<DescriptionsItemOption['tooltip']>,
	/**
	 * 透传给内置控件
	 */
	options: Object as PropType<Record<string, any>>,
	prefix: valueType,
	suffix: valueType,
	hidden: Boolean,
	labelClass: [String, Object, Array],
	labelStyle: [String, Object, Array],
	contentClass: [String, Object, Array],
	contentStyle: [String, Object, Array]
};
export type Props = ExtractPropTypes<typeof props>;
