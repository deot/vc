import type { ExtractPropTypes } from 'vue';
import { props as editorProps } from '../editor-props';

export const props = {
	...editorProps,
	// 移动端默认聚焦时停在虚拟键盘上方
	toolbarPlacement: {
		...editorProps.toolbarPlacement,
		default: 'keyboard' as const
	}
};
export type Props = ExtractPropTypes<typeof props>;
