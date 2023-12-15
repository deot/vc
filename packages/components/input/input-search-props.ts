import type { ExtractPropTypes } from 'vue';
import { props as inputProps } from './input-props';

export const props = {
	...inputProps,
	enterText: {
		type: [Boolean, String],
		default: true
	}
};
export type Props = ExtractPropTypes<typeof props>;
