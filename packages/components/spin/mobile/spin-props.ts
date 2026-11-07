import type { ExtractPropTypes } from 'vue';
import { props as spinProps } from '../spin-props';

export const props = {
	...spinProps,
	// 数字为 750 稿长度，字符串为 CSS 长度
	size: {
		...spinProps.size,
		default: 56
	}
};
export type Props = ExtractPropTypes<typeof props>;
