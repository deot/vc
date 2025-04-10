import type { ExtractPropTypes } from 'vue';
import { pick } from 'lodash-es';
import { props as wrapperProps } from './wrapper-props';

const wrapperKeys = [
	'modelValue',
	'animation',
	'placement',
	'theme',
	'content',
	'getPopupContainer',
	'portal',
	'arrow',
	'portalClass',
	'portalStyle',
	'autoWidth',
	'always'
] as const;

export const props = {
	trigger: {
		type: String,
		default: 'hover',
		validator: (v: string) => /(hover|strictHover|click|focus|custom)/.test(v)
	},
	tag: {
		type: String,
		default: 'span'
	},
	disabled: {
		type: Boolean,
		default: false
	},
	outsideClickable: {
		type: Boolean,
		default: true
	},
	...(pick(wrapperProps, wrapperKeys) as Pick<typeof wrapperProps, typeof wrapperKeys[number]>)
};
export type Props = ExtractPropTypes<typeof props>;
