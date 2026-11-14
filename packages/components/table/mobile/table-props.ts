import type { ExtractPropTypes } from 'vue';
import { props as tableProps } from '../table-props';

export const props = {
	...tableProps,
	// 树节点的缩进（750 稿）：375 宽下每级 16px，与桌面端一致
	indent: {
		...tableProps.indent,
		default: 32
	}
};
export type Props = ExtractPropTypes<typeof props>;
