import type { ExtractPropTypes } from 'vue';
import { props as cardProps } from '../card-props';

export const props = {
	...cardProps,
	// 数字为 750 稿长度，字符串为 CSS 长度
	padding: {
		...cardProps.padding,
		default: 32
	}
};
export type Props = ExtractPropTypes<typeof props>;
