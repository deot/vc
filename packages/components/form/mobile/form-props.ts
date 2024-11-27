import type { ExtractPropTypes } from 'vue';
import { props as formProps } from '../form-props';

export const props = {
	...formProps,
	showToast: {
		type: Boolean,
		default: false
	},
	border: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;
