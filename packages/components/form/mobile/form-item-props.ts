import type { ExtractPropTypes } from 'vue';
import { props as formItemProps } from '../form-item-props';

export const props = {
	...formItemProps,
	indent: {
		type: Number,
		default: 12
	}
};
export type Props = ExtractPropTypes<typeof props>;
