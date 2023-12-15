import type { ExtractPropTypes } from 'vue';
import { props as formProps } from '../form-props';

export const props = {
	...formProps,
	showMessage: {
		type: Boolean,
		default: true
	},
	border: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;
