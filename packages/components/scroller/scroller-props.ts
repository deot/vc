import type { ExtractPropTypes, StyleValue, PropType } from 'vue';
import { pick } from 'lodash-es';
import { props as barProps } from './bar-props';

const barKeys = [
	'always',
	'thumbMinSize',
	'thumbStyle',
	'thumbClassName',
	'trackStyle',
	'trackClassName',
	'trackOffsetX',
	'trackOffsetY',
	'autoResize',
	'native'
] as const;

export const props = {
	tag: {
		type: String,
		default: 'div',
	},
	height: {
		type: [String, Number],
		default: '',
	},
	maxHeight: {
		type: [String, Number],
		default: '',
	},
	wrapperStyle: {
		type: [String, Array, Object] as PropType<StyleValue>,
		default: '',
	},
	wrapperClassName: {
		type: [String, Array, Object] as PropType<StyleValue>,
		default: '',
	},
	contentStyle: {
		type: [String, Array, Object] as PropType<StyleValue>,
		default: '',
	},
	contentClassName: {
		type: [String, Array, Object] as PropType<StyleValue>,
		default: '',
	},

	barTo: barProps.to,
	...(pick(barProps, barKeys) as Pick<typeof barProps, typeof barKeys[number]>)
};
export type Props = ExtractPropTypes<typeof props>;
