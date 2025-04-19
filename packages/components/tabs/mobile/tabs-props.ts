import type { ExtractPropTypes } from 'vue';
import { props as tabsProps } from '../tabs-props';

export const props = {
	...tabsProps,
	theme: {
		type: String,
		default: 'light',
		validator: (v: string) => /(light|dark)/.test(v)
	},
	barStyle: {
		type: [Object, Array],
		default: () => ({}),
	},
	autoAfloatWidth: {
		type: Boolean,
		default: true,
	},
	average: {
		type: Boolean,
		default: true
	},
	showWrapper: {
		type: Boolean,
		default: true
	},
	sticky: {
		type: Boolean,
		default: false
	},
	offsetTop: {
		type: Number,
		default: 0
	},
	showStep: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;
