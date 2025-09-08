import type { ExtractPropTypes } from 'vue';

export const props = {
	fixed: {
		type: Boolean,
		default: true
	},
	modelValue: {
		type: Boolean,
		default: false
	},
	mask: {
		type: Boolean,
		default: true
	},
	maskClosable: {
		type: Boolean,
		default: true
	},
	placement: {
		type: String,
		default: 'bottom',
		validator: v => /(bottom|top|left|right|center)/.test(v)
	},
	theme: {
		type: String,
		default: 'light',
		validator: v => /(light|dark|none)/.test(v)
	},
	wrapperClass: [Object, Array, String],
	wrapperStyle: [Object, Array, String],
	scrollRegExp: {
		type: Object,
		default: () => ({
			className: /(vcm?-popup-scrollable)/
		})
	}
};
export type Props = ExtractPropTypes<typeof props>;
