import type { ExtractPropTypes } from 'vue';

export const props = {
	closable: {
		type: Boolean,
		default: false
	},
	checkable: {
		type: Boolean,
		default: false
	},
	checked: {
		type: Boolean,
		default: true
	},
	color: {
		type: String,
		default: 'default',
		// validator: v => /(default|primary|success|warning|error)/.test(v),
	},
	type: {
		type: String,
		validator: v => /(default|dot|border)/.test(v),
		default: 'default'
	},
	value: {
		type: [String, Number]
	}
};
export type Props = ExtractPropTypes<typeof props>;
