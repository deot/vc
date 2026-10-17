import type { ExtractPropTypes, PropType } from 'vue';
import type { Props as ScrollerProps } from '../scroller/scroller-props';
import { valueType } from '../customer/customer-props';

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
	content: valueType,
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
	scrollerOptions: Object as PropType<Partial<ScrollerProps>>,
	// 焦点留在触发器的输入框：在浮层内、触发器的非输入区域按下鼠标不转移焦点；浮层打开时点击触发器的输入框不关闭
	keepFocus: Boolean
};
export type Props = ExtractPropTypes<typeof props>;
