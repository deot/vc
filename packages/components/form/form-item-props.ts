import type { ExtractPropTypes } from 'vue';

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
		type: Boolean,
		default: false
	},
	error: {
		type: String
	},
	rules: {
		type: [Array, Object]
	},
	resetByRulesChanged: {
		type: Boolean,
		default: false
	},
	showMessage: {
		type: Boolean,
		default: true
	},
	// validateStatus: {
	// 	type: String
	// },
	labelFor: {
		type: String
	},

	styleless: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;