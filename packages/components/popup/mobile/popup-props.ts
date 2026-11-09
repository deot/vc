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

// 手指方向
export type PopupDragDirection = 'up' | 'down' | 'left' | 'right';

export interface PopupDragStartEvent {
	// 当前档的序号（没有 snaps 时为 0）
	snap: number;
	// 面板露出的尺寸（px）：上下弹出为高度，左右弹出为宽度
	height: number;
}

export interface PopupDragEvent extends PopupDragStartEvent {
	// 相对按下时移动的距离（px），向外（关闭方向）为正
	offset: number;
	// 最低档为 0、最高档为 1；低于最低档为负，-1 为完全滑出。没有 snaps 时打开为 0、关闭为 -1
	progress: number;
	direction: PopupDragDirection;
	// 速度（px/s），向外为正
	velocity: number;
}

export interface PopupDragEndEvent {
	// 松手后吸附到的档
	snap: number;
	// 是否即将关闭
	close: boolean;
	// 目标位置的进度（同 drag），关闭时为 -1；外部样式可按它过渡到终点
	progress: number;
	velocity: number;
}

// header / handle / footer 插槽的参数
export interface PopupSlotProps {
	snap: number;
	full: boolean;
	dragging: boolean;
	close: () => void;
	snapTo: (index: number) => void;
	next: () => void;
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
	// 多档高度（只对 bottom / top 生效），按高度从低到高：数字为 750 稿长度，字符串为 CSS 长度，百分比相对视口高度，'100%' 即全屏（留白用 calc(100% - 40px)）
	// 各档都不超过内容自身的高度；不设置时面板高度由内容决定
	snaps: Array as PropType<Array<number | string>>,
	// 当前档的序号，支持 v-model:snap
	snap: {
		type: Number,
		default: 0
	},
	// 面板内侧的指示器（点击切换到下一档，拖动时随方向倾斜）；不设置时在设置了 snaps 时显示
	handle: {
		type: Boolean,
		default: undefined
	},
	wrapperClass: [Object, Array, String],
	wrapperStyle: [Object, Array, String],
	// 内容区（content 与默认插槽所在的元素）的 class / style；有标题栏、content 或 footer 插槽时有效
	contentClass: [Object, Array, String],
	contentStyle: [Object, Array, String],
	// 额外视为滚动容器的元素；计算样式 overflow 为 auto / scroll 的元素已自动识别，一般不需要
	scrollRegExp: {
		type: Object,
		default: () => ({
			className: /(vcm?-popup-scrollable)/
		})
	}
};
export type Props = ExtractPropTypes<typeof props>;
