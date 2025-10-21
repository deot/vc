import type { ExtractPropTypes, PropType } from 'vue';
import type { FormRule } from './types';

export const props = {
	tag: {
		type: String,
		default: 'form'
	},
	model: {
		type: Object
	},
	rules: {
		type: Object as PropType<Record<string, FormRule>>
	},
	labelWidth: {
		type: Number,
	},
	showMessage: {
		type: Boolean,
		default: true
	},
	inline: {
		type: Boolean,
		default: false
	},
	labelPosition: {
		type: String as PropType<'left' | 'right' | 'top'>,
		default: 'right'
	},
	autocomplete: {
		type: String as PropType<'on' | 'off'>,
		default: 'off'
	},
	styleless: {
		type: Boolean,
		default: false
	},
	// 给formItem统一注入
	contentStyle: [Object, String],
	contentClass: [Object, String],
	labelStyle: [Object, String],
	labelClass: [Object, String],
	errorStyle: [Object, String],
	errorClass: [Object, String],
	// 给nestFormItem统一注入
	nestedContentStyle: [Object, String],
	nestedContentClass: [Object, String],
	nestedLabelStyle: [Object, String],
	nestedLabelClass: [Object, String],
	nestedErrorStyle: [Object, String],
	nestedErrorClass: [Object, String]
};
export type Props = ExtractPropTypes<typeof props>;
