import type { ExtractPropTypes } from 'vue';
import { props as stepsProps } from '../steps-props';

export const props = {
	...stepsProps,
	// 手机宽度下标题在节点右侧会被挤窄，默认放在节点下方，各步等分宽度
	labelPosition: {
		...stepsProps.labelPosition,
		default: 'bottom' as const
	}
};
export type Props = ExtractPropTypes<typeof props>;
