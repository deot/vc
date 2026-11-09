import type { ExtractPropTypes, PropType } from 'vue';
import { pick } from 'lodash-es';
import { props as inputProps } from '../input/input-props';

const inputKeys = [
	'id',
	'disabled',
	'maxlength',
	'allowDispatch',
	'modelValue',
	'bytes',
	'controllable'
] as const;
export const props = {
	...(pick(inputProps, inputKeys) as Pick<typeof inputProps, typeof inputKeys[number]>),
	wrap: {
		type: String,
		validator: v => /(soft|hard)/.test(v),
		default: 'soft',

	},
	rows: {
		type: Number,
		default: 2
	},
	autosize: {
		type: [Boolean, Object],
		default: false
	},
	textareaStyle: {
		type: [Object, Array]
	},
	// 计数：需同时设置 maxlength；inverted 显示剩余数，inline（仅 Textarea）放在框内右下角；MTextarea 始终在框内
	indicator: {
		type: [Boolean, Object] as PropType<boolean | { inverted?: boolean; inline?: boolean }>,
		default: false
	},
	indicateClass: String
};
export type Props = ExtractPropTypes<typeof props>;
