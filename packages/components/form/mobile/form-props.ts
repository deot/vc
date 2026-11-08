import type { ExtractPropTypes, PropType } from 'vue';
import { props as formProps } from '../form-props';

export const props = {
	...formProps,
	/**
	 * 标签宽度，750 稿长度；auto时参与对齐的标签取其中最宽的
	 */
	labelWidth: {
		type: [Number, String] as PropType<number | 'auto'>,
		default: 192
	},
	// 移动端屏幕窄，提示容易换行，默认放在文档流里
	errorLayout: {
		type: String as PropType<'flow' | 'overlay'>,
		default: 'flow'
	},
	showToast: {
		type: Boolean,
		default: false
	},
	border: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;
