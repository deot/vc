import type { ExtractPropTypes, PropType } from 'vue';
import { pick } from 'lodash-es';
import { props as popoverProps } from '../popover/popover-props';
import { props as pickerViewProps } from './color-picker-view/color-picker-view-props';

const popoverKeys = [
	'portalClass'
] as const;

export const props = {
	...(pick(popoverProps, popoverKeys) as Pick<typeof popoverProps, typeof popoverKeys[number]>),
	...pickerViewProps,
	disabled: {
		type: Boolean,
		default: false
	},
	trigger: {
		type: String,
		default: 'click'
	},
	arrow: {
		type: Boolean,
		default: false
	},
	size: {
		type: String as PropType<'mini' | 'small' | 'medium' | 'large'>,
		default: 'medium',
		validator: (v: string) => /^(mini|small|medium|large)$/.test(v)
	},
	// 浮层内可直接输入色值
	editable: {
		type: Boolean,
		default: true
	},
	// 为 true 时点「确定」才提交，点外部关闭放弃修改；否则选色即提交
	confirm: {
		type: Boolean,
		default: false
	},
	// 悬停触发器时显示清除图标
	clearable: {
		type: Boolean,
		default: true
	},
	// 未选择（清空）时的值
	nullValue: {
		type: [String, Object] as PropType<string | null>,
		default: ''
	}
};
export type Props = ExtractPropTypes<typeof props>;
