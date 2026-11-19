import type { ExtractPropTypes } from 'vue';
import { props as progressProps } from '../progress-props';

export const props = {
	...progressProps,
	// 数字为 750 稿长度，字符串为 CSS 长度
	size: {
		...progressProps.size,
		default: 136
	}
};
export type Props = ExtractPropTypes<typeof props>;
