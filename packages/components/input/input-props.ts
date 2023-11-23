import type { ExtractPropTypes, PropType, StyleValue } from 'vue';

export const props = {
	type: {
		type: String as PropType<'text' | 'password' | 'tel' | 'search' | 'date' | 'number' | 'email' | 'url'>,
		default: 'text'
	},
	// Array, 作为select等数组存放临时值
	modelValue: {
		type: [String, Number, Array] as PropType<string | number | any[]>,
		default: ''
	},
	placeholder: {
		type: String,
		default: ''
	},
	maxlength: Number,
	disabled: {
		type: Boolean,
		default: false
	},
	readonly: {
		type: Boolean,
		default: false
	},
	name: {
		type: String
	},
	autofocus: {
		type: Boolean,
		default: false
	},
	spellcheck: {
		type: Boolean,
		default: false
	},
	autocomplete: {
		type: String as PropType<'on' | 'off' | 'new-password'>,
		default: 'off'
	},
	clearable: {
		type: Boolean,
		default: false
	},
	elementId: {
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
	inputStyle: {
		type: [String, Object, Array] as PropType<StyleValue>
	},
	allowDispatch: {
		type: Boolean,
		default: true
	},
	// 聚焦时光标是否在文字最后面
	focusEnd: {
		type: Boolean,
		default: false
	},
	// 是否按字节数计算长度，1个长度 = 2个字节，影响maxlength
	bytes: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;