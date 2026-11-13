import type { ExtractPropTypes } from 'vue';
import { omit } from 'lodash-es';
import { props as tabsProps } from '../tabs-props';

// 外观（type、size）与标签栏位置（placement）只属于桌面端
const desktopKeys = ['type', 'size', 'placement'] as const;

export const props = {
	...(omit(tabsProps, desktopKeys) as Omit<typeof tabsProps, typeof desktopKeys[number]>),
	theme: {
		type: String,
		default: 'light',
		validator: (v: string) => /(light|dark)/.test(v)
	},
	barStyle: {
		type: [Object, Array],
		default: () => ({}),
	},
	autoAfloatWidth: {
		type: Boolean,
		default: true,
	},
	average: {
		type: Boolean,
		default: true
	},
	showWrapper: {
		type: Boolean,
		default: true
	},
	sticky: {
		type: Boolean,
		default: false
	},
	offsetTop: {
		type: Number,
		default: 0
	},
	// 在内容区左右滑动切换到相邻的标签（跳过禁用的），只识别触摸
	swipeable: {
		type: Boolean,
		default: false
	},
	// 移动端以触摸滑动为主，默认不显示翻页按钮
	stepper: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;
