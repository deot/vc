import type { ExtractPropTypes, PropType } from 'vue';
import { valueType, valueOrBooleanType } from '../../customer/customer-props';

export type NavBarScroller = HTMLElement | Window;

export const props = {
	// 标题：居中、单行省略
	title: valueType,
	// 副标题：标题下方，字号较小
	subtitle: valueType,
	// 返回区域：true 只显示箭头；字符串或渲染函数为箭头后的文字；false 不渲染
	back: {
		type: valueOrBooleanType,
		default: true
	},
	// 返回箭头的 Icon type；false 时只显示文字
	backIcon: {
		type: [String, Boolean] as PropType<string | false>,
		default: 'left'
	},
	// 右侧内容，也可以用 #right 插槽
	right: valueType,
	// 底部分割线
	border: {
		type: Boolean,
		default: true
	},
	// 固定在视口顶部
	fixed: {
		type: Boolean,
		default: false
	},
	// fixed 时在原位置留同高占位（含安全区）
	placeholder: {
		type: Boolean,
		default: true
	},
	// 顶部补安全区，不传时跟随 fixed
	safeArea: {
		type: Boolean,
		default: void 0
	},
	// fixed 时的层级
	zIndex: Number,
	/**
	 * true：始终透明，没有背景与分割线；
	 * 数字（750 稿）：滚动距离从 0 到该值时由透明渐变为实底
	 */
	transparent: {
		type: [Boolean, Number],
		default: false
	},
	// transparent 为数字时监听的滚动容器；不传时从自身位置向上找最近的滚动容器，找不到为 window
	getScroller: Function as PropType<() => NavBarScroller | null | undefined>
};

export type Props = ExtractPropTypes<typeof props>;
