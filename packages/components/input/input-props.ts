import type { ExtractPropTypes, PropType, StyleValue } from 'vue';

export const props = {
	// Array, 作为select等数组存放临时值
	modelValue: [String, Number, Array] as PropType<string | number | any[]>,
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

// Input 独有（MInput 没有）：计数
export const indicatorProps = {
	indicator: {
		type: [Boolean, Object] as PropType<boolean | ({ inline: boolean; inverted: boolean })>,
		default: false
	},
	indicateClass: String
};

// 桌面端取值类组件共用（Input / InputNumber / Textarea 两端、DatePicker、ColorPicker；Select 系列只取 plaintext）：只显示值的文字；InputSearch、AutoComplete 不支持
export const plaintextProps = {
	// 只显示值的文字，不渲染输入框、浮层等：没有样式，不能交互；没有值时显示 extra
	plaintext: {
		type: Boolean,
		default: false
	},
	// plaintext 没有值时显示的文字
	extra: {
		type: String,
		default: ''
	}
};

// MInput / MTextarea 独有：文字右对齐
export const rightProps = {
	right: {
		type: Boolean,
		default: false
	}
};
