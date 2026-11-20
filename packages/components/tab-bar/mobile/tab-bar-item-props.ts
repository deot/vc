import type { ExtractPropTypes, PropType } from 'vue';
import { valueType } from '../../customer/customer-props';
import type { CustomerValue } from '../../customer/types';
import type { Props as BadgeProps } from '../../badge/badge-props';

export type TabBarValue = string | number;

// 字符串为 Icon 的 type；函数（与插槽相同）收到 { item, index, active }
export type TabBarIcon = string | Exclude<CustomerValue, string | boolean>;

// 数字、字符串为 MBadge 的 value；true 为圆点；对象透传给 MBadge
export type TabBarBadge = number | string | boolean | Partial<BadgeProps>;

export type TabBarTo = string | Record<string, any> | (() => any);

export interface TabBarOption {
	// 不传时取序号
	value?: TabBarValue;
	label?: CustomerValue;
	icon?: TabBarIcon;
	// 选中时的图标，不传沿用 icon
	activeIcon?: TabBarIcon;
	badge?: TabBarBadge;
	to?: TabBarTo;
	disabled?: boolean;
	class?: any;
	style?: any;
	[key: string]: any;
}

export const props = {
	value: {
		type: [String, Number] as PropType<TabBarValue>
	},
	label: valueType,
	icon: [String, Function, Object] as PropType<TabBarIcon>,
	activeIcon: [String, Function, Object] as PropType<TabBarIcon>,
	badge: {
		type: [Number, String, Boolean, Object] as PropType<TabBarBadge>,
		default: void 0
	},
	to: [String, Object, Function] as PropType<TabBarTo>,
	disabled: {
		type: Boolean,
		default: false
	}
};

export type Props = ExtractPropTypes<typeof props>;
