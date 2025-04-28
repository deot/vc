import type { ExtractPropTypes, PropType } from 'vue';
import type { FormRule } from './types';

export const props = {
	label: {
		type: String,
		default: ''
	},
	labelWidth: {
		type: Number
	},
	prop: {
		type: String
	},
	required: {
		type: [Boolean, String],
		default: false
	},
	// 控制`*`是否展示
	asterisk: {
		type: Boolean,
		default: true
	},
	error: {
		type: String
	},
	rules: {
		type: [Array, Object] as PropType<FormRule | FormRule[]>
	},
	resetByRulesChanged: {
		type: Boolean,
		default: false
	},
	showMessage: {
		type: Boolean,
		default: true
	},
	labelFor: {
		type: String
	},
	styleless: {
		type: Boolean,
		default: false
	},
	labelPosition: {
		type: String as PropType<'left' | 'right' | 'top'>,
		default: 'right'
	},
	contentStyle: String
};
export type Props = ExtractPropTypes<typeof props>;
