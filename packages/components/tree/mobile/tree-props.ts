import type { ExtractPropTypes } from 'vue';
import { props as treeProps } from '../tree-props';

export const props = {
	...treeProps,
	// 每级的缩进（750 稿）：375 宽下每级 16px
	indent: {
		...treeProps.indent,
		default: 32
	}
};
export type Props = ExtractPropTypes<typeof props>;
