import { omit } from 'lodash-es';
import type { ExtractPropTypes, PropType } from 'vue';
import { props as drawerProps } from '../drawer-view-props';
import { props as popupProps } from '../../popup/mobile/popup-props';

// 内容区由 MScroller 原生滚动，没有 scrollerOptions
const omitKeys = ['scrollerOptions'] as const;

export const props = {
	...(omit(drawerProps, omitKeys) as Omit<typeof drawerProps, typeof omitKeys[number]>),
	// 左右抽屉宽度：数字为 750 稿长度（默认 600 即屏宽的 80%），字符串为 CSS 长度
	width: {
		...drawerProps.width,
		default: 600
	},
	// 上下抽屉高度：数字为 750 稿长度，字符串为 CSS 长度；不设置时由内容决定（最高到 MPopup 的留白）
	height: {
		type: [Number, String] as PropType<number | string>,
		default: undefined
	},
	// 手势滑动关闭，同 MPopup；不设置时跟随 maskClosable；closeWithCancel 时同样先经过 onCancel
	swipeClosable: popupProps.swipeClosable
};
export type Props = ExtractPropTypes<typeof props>;
