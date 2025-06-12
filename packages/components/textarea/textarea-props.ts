import type { ExtractPropTypes } from 'vue';
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
	}
};
export type Props = ExtractPropTypes<typeof props>;
