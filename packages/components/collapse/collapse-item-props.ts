import type { ExtractPropTypes, PropType } from 'vue';
import { valueType } from '../customer/customer-props';

export const props = {
	tag: {
		type: String,
		default: 'div'
	},
	value: {
		type: [String, Number]
	},
	title: valueType,
	extra: valueType,
	content: valueType,
	disabled: {
		type: Boolean,
		default: false
	},
	// 未设置时继承 Collapse
	arrow: {
		type: [String, Boolean] as PropType<'left' | 'right' | false>,
		default: undefined
	},
	// 未设置时继承 Collapse
	collapsible: {
		type: Boolean,
		default: undefined
	},
	// 未设置时继承 Collapse
	alive: {
		type: Boolean,
		default: undefined
	},
	// 与 Collapse 的同名属性合并，样式同名时以 CollapseItem 为准
	headerStyle: [Object, String],
	headerClass: [Object, String],
	contentStyle: [Object, String],
	contentClass: [Object, String]
};
export type Props = ExtractPropTypes<typeof props>;
