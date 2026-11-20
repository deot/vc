import type { ExtractPropTypes } from 'vue';
import { props as inputProps, indicatorProps, rightProps } from '../input/input-props';
import { props as suggestProps } from '../suggest/suggest-props';

// AutoComplete 与 MAutoComplete 共有：Input 的属性（原样传给输入框）+ 联想 + 弹层宽度
const shared = {
	...inputProps,
	...suggestProps,
	// 弹层宽度：false 时与输入框同宽，true 时按内容
	autoWidth: {
		type: Boolean,
		default: false
	}
};

export const props = {
	...shared,
	// Input 独有：计数
	...indicatorProps
};
export type Props = ExtractPropTypes<typeof props>;

export const mobileProps = {
	...shared,
	// MInput 独有：文字右对齐
	...rightProps
};
export type MobileProps = ExtractPropTypes<typeof mobileProps>;
