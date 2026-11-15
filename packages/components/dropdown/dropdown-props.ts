import type { ExtractPropTypes } from 'vue';
import { pick } from 'lodash-es';
import { props as popoverProps } from '../popover/popover-props';

const popoverKeys = ['scrollable', 'scrollerOptions'] as const;

export const props = {
	modelValue: {
		type: Boolean,
		default: false,
	},
	portalClass: [String, Object],
	placement: {
		type: String,
		default: 'bottom'
	},
	trigger: {
		type: String,
		default: 'hover'
	},
	// 弹出浮层的箭头
	arrow: {
		type: Boolean,
		default: false
	},
	// 触发区内容之后的箭头，展开时翻转
	caret: {
		type: Boolean,
		default: false
	},
	...(pick(popoverProps, popoverKeys) as Pick<typeof popoverProps, typeof popoverKeys[number]>)
};
export type Props = ExtractPropTypes<typeof props>;
