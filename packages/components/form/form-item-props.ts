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
	}
};
export type Props = ExtractPropTypes<typeof props>;
