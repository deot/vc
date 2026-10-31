import type { ExtractPropTypes, PropType } from 'vue';
import type { TabsType, TabsSize, TabsPlacement } from './types';

export const TABS_TYPES = ['line', 'card', 'button', 'capsule', 'text', 'round'] as const;
export const TABS_SIZES = ['mini', 'small', 'medium', 'large'] as const;
export const TABS_PLACEMENTS = ['top', 'bottom', 'left', 'right'] as const;

export const props = {
	type: {
		type: String as PropType<TabsType>,
		default: 'line',
		validator: (v: string) => TABS_TYPES.includes(v as any)
	},
	size: {
		type: String as PropType<TabsSize>,
		default: 'medium',
		validator: (v: string) => TABS_SIZES.includes(v as any)
	},
	// 标签栏相对内容的位置
	placement: {
		type: String as PropType<TabsPlacement>,
		default: 'top',
		validator: (v: string) => TABS_PLACEMENTS.includes(v as any)
	},
	modelValue: {
		type: [String, Number, Boolean]
	},
	animated: {
		type: Boolean,
		default: false
	},
	afloat: {
		type: Boolean,
		default: true
	},
	closable: {
		type: Boolean,
		default: false
	},
	// 标签溢出时，标签栏两端显示前后翻页按钮
	stepper: {
		type: Boolean,
		default: true
	},
	// 面板首次激活时才渲染内容；TabsPane 可单独覆盖
	lazy: {
		type: Boolean,
		default: true
	},
	// 面板隐藏后保留内容；为 false 时隐藏即卸载，TabsPane 可单独覆盖
	alive: {
		type: Boolean,
		default: true
	},
	barStyle: [Object, String],
	contentStyle: [Object, String],
	barClass: [Object, String],
	contentClass: [Object, String],
	affixable: Boolean,
	affixOptions: Object
};
export type Props = ExtractPropTypes<typeof props>;
