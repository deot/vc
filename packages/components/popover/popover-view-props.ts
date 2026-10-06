import type { ExtractPropTypes, PropType } from 'vue';
import type { Props as ScrollerProps } from '../scroller/scroller-props';

export const props = {
	modelValue: Boolean,
	animation: String,
	placement: {
		type: String,
		default: 'bottom',
		validator: (value: string) => {
			return [
				'bottom', 'bottom-left', 'bottom-right',
				'top', 'top-left', 'top-right',
				'right', 'right-top', 'right-bottom',
				'left', 'left-top', 'left-bottom'
			].includes(value);
		}
	},
	theme: {
		type: String,
		default: 'light',
		validator: (v: string) => /(light|dark|none)/.test(v)
	},
	content: [String, Function],
	getPopupContainer: Function,
	portal: {
		type: Boolean,
		default: true
	},
	arrow: { // 是否显示箭头
		type: Boolean,
		default: true
	},
	autoWidth: { // 当为false是，使用triggerElement宽度
		type: Boolean,
		default: true
	},
	triggerElement: {
		type: Object,
		required: true
	},
	onChange: {
		type: Function,
		default: () => {}
	},
	onReady: Function,
	// 直接传送门标记调用时，hover需要绑定事件
	alone: {
		type: Boolean,
		default: true
	},
	hover: Boolean,
	always: Boolean,
	portalClass: [Object, String, Array],
	portalStyle: [Object, String],
	// 内容区由内置的 Scroller 滚动；为 false 时内容区不滚动，由内容自行收缩并滚动
	scrollable: {
		type: Boolean,
		default: true
	},
	// 内置 Scroller 的属性；设置 height / maxHeight 时内容区按该高度滚动
	scrollerOptions: Object as PropType<Partial<ScrollerProps>>
};
export type Props = ExtractPropTypes<typeof props>;
