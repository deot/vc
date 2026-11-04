import type { ExtractPropTypes } from 'vue';
import { props as spinProps } from '../spin-props';

export const props = {
	...spinProps,
	// 750 稿长度
	size: {
		type: Number,
		default: 56
	}
};
export type Props = ExtractPropTypes<typeof props>;
