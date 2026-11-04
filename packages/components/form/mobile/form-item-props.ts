import type { ExtractPropTypes } from 'vue';
import { props as formItemProps } from '../form-item-props';

export const props = {
	...formItemProps,
	// 左内边距，750 稿长度；不传时取样式默认值
	indent: Number
};
export type Props = ExtractPropTypes<typeof props>;
