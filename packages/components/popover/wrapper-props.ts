import type { ExtractPropTypes } from 'vue';

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
	autoWidth: { // 同宽
		type: Boolean,
		default: false
	},
	triggerEl: {
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
	portalStyle: Object
};
export type Props = ExtractPropTypes<typeof props>;
