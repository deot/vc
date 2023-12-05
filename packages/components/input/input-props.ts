import type { ExtractPropTypes, PropType, StyleValue } from 'vue';

export const props = {
	// Array, 作为select等数组存放临时值
	modelValue: {
		type: [String, Number, Array] as PropType<string | number | any[]>,
		default: ''
	},
	disabled: {
		type: Boolean,
		default: false
	},
	maxlength: Number,
	// 聚焦时光标是否在文字最后面
	focusEnd: {
		type: Boolean,
		default: false
	},
	clearable: {
		type: Boolean,
		default: false
	},
	// 避免inheritAttrs为false时不会自动添加到根节点
	id: {
		type: String
	},
	prepend: {
		type: String
	},
	append: {
		type: String
	},
	afloat: {
		type: Boolean,
		default: false
	},	
	inputId: {
		type: String
	},
	inputStyle: {
		type: [String, Object, Array] as PropType<StyleValue>
	},
	allowDispatch: {
		type: Boolean,
		default: true
	},
	// 是否按字节数计算长度，1个长度 = 2个字节，影响maxlength
	bytes: {
		type: Boolean,
		default: false
	},
	styleless: {
		type: Boolean,
		default: false
	},

	/**
	 * 完全受控组件：输入框内的值为modelValue. 
	 * 非完全受控时: 输入框内的值就是当前输入的值，modelValue变更，输入框的值也会更改
	 */
	controllable: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;