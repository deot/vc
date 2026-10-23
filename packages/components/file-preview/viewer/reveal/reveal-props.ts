import type { ExtractPropTypes, PropType } from 'vue';
import type { Size } from '../utils';

export const props = {
	/**
	 * 打开的那一项、还没切换过时为 true：画面就位后从 triggerElement 放大
	 */
	animated: Boolean,
	viewport: {
		type: Object as PropType<Size>,
		required: true as const
	},
	/**
	 * 打开时从它放大，关闭时缩回它现在的位置
	 */
	triggerElement: Object as PropType<Element | null>
};
export type Props = ExtractPropTypes<typeof props>;
