import type { ExtractPropTypes, PropType } from 'vue';

export const props = {
	tag: {
		type: String,
		default: 'div'
	},
	accordion: {
		type: Boolean,
		default: false
	},
	modelValue: {
		type: [Array, String, Number]
	},
	alive: {
		type: Boolean,
		default: true
	},
	styleless: {
		type: Boolean,
		default: false
	},
	border: {
		type: Boolean,
		default: true
	},
	disabled: {
		type: Boolean,
		default: false
	},
	// 为 false 时已展开的面板不能通过点击收起，CollapseItem 可单独覆盖
	collapsible: {
		type: Boolean,
		default: true
	},
	// 箭头位置，false 时不显示
	arrow: {
		type: [String, Boolean] as PropType<'left' | 'right' | false>,
		default: 'left',
		validator: (v: string | boolean) => v === false || /^(left|right)$/.test(v as string)
	},
	// 可触发折叠的区域
	triggerRegion: {
		type: String as PropType<'header' | 'arrow'>,
		default: 'header',
		validator: (v: string) => /^(header|arrow)$/.test(v)
	},
	headerStyle: [Object, String],
	headerClass: [Object, String],
	contentStyle: [Object, String],
	contentClass: [Object, String]
};
export type Props = ExtractPropTypes<typeof props>;
