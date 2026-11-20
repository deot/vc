import type { ExtractPropTypes, PropType } from 'vue';
import { props as textareaProps } from '../textarea/textarea-props';
import { rightProps } from '../input/input-props';
import { props as suggestProps } from '../suggest/suggest-props';

// Mention 与 MMention 共有：Textarea 的属性（原样传给文本域）+ 联想 + 前缀与分隔符
export const props = {
	...textareaProps,
	...suggestProps,
	// 触发提及的前缀，可多个
	prefix: {
		type: [String, Array] as PropType<string | string[]>,
		default: '@'
	},
	// 选中后补在提及之后的分隔符；搜索词里出现它即结束提及
	split: {
		type: String,
		default: ' '
	}
};
export type Props = ExtractPropTypes<typeof props>;

export const mobileProps = {
	...props,
	// MTextarea 独有：文字右对齐
	...rightProps
};
export type MobileProps = ExtractPropTypes<typeof mobileProps>;
