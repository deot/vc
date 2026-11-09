import type { ExtractPropTypes, PropType } from 'vue';
import { valueOrBooleanType, valueType } from '../../customer/customer-props';

export type PopupPlacement = 'top' | 'right' | 'bottom' | 'left' | 'center';
export type PopupDirection = Exclude<PopupPlacement, 'center'>;

export interface PopupSwipeOptions {
	// 可滑动关闭的方向，可指定多个；默认为弹出方向（center 没有默认方向）
	directions?: PopupDirection[];
	// 拖动超过面板尺寸的比例时关闭，[0, 1]
	threshold?: number;
	// 松手时的速度（px/s）超过它也关闭
	speed?: number;
}

export const props = {
	fixed: {
		type: Boolean,
		default: true
	},
	modelValue: {
		type: Boolean,
		default: false
	},
	mask: {
		type: Boolean,
		default: true
	},
	maskClosable: {
		type: Boolean,
		default: true
	},
	placement: {
		type: String as PropType<PopupPlacement>,
		default: 'bottom',
		validator: (v: string) => /^(bottom|top|left|right|center)$/.test(v)
	},
	theme: {
		type: String,
		default: 'light',
		validator: (v: string) => /^(light|dark|none)$/.test(v)
	},
	// 标题；false 不显示。有 title、header 插槽或 closable 时显示标题栏
	title: valueOrBooleanType,
	// 内容，在默认插槽之前
	content: valueType,
	// 标题栏右侧的关闭按钮
	closable: {
		type: Boolean,
		default: false
	},
	// 有标题栏或 content 时，内容区由 MScroller 滚动（原生滚动）；为 false 时内容区不滚动
	scrollable: {
		type: Boolean,
		default: true
	},
	// 手势滑动关闭：true 时沿弹出方向；对象可配置方向、比例与速度；不设置时跟随 maskClosable（默认可关闭）
	swipeClosable: {
		type: [Boolean, Object] as PropType<boolean | PopupSwipeOptions>,
		default: undefined
	},
	wrapperClass: [Object, Array, String],
	wrapperStyle: [Object, Array, String],
	// 额外视为滚动容器的元素；计算样式 overflow 为 auto / scroll 的元素已自动识别，一般不需要
	scrollRegExp: {
		type: Object,
		default: () => ({
			className: /(vcm?-popup-scrollable)/
		})
	}
};
export type Props = ExtractPropTypes<typeof props>;
