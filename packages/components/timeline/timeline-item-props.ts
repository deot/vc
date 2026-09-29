import type { ExtractPropTypes, PropType } from 'vue';
import type { Props as CustomerProps } from '../customer/customer-props';

export const props = {
	label: {
		type: [String, Function] as PropType<string | CustomerProps['render']>,
		default: ''
	},
	/**
	 * 自定义节点，设置后dotColor/dotType不生效
	 */
	dot: {
		type: [String, Function] as PropType<string | CustomerProps['render']>
	},
	dotColor: String,
	dotType: {
		type: String as PropType<'solid' | 'hollow'>,
		default: 'solid'
	},
	lineColor: String,
	lineType: {
		type: String as PropType<'solid' | 'dashed' | 'dotted'>,
		default: 'solid'
	},
	/**
	 * 标签位于轴线另一侧，未设置时继承Timeline
	 */
	opposite: {
		type: Boolean,
		default: void 0
	}
};
export type Props = ExtractPropTypes<typeof props>;
