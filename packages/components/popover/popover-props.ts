import type { ExtractPropTypes } from 'vue';
import { pick } from 'lodash-es';
import { props as viewProps } from './popover-view-props';

const viewKeys = [
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
	...(pick(viewProps, viewKeys) as Pick<typeof viewProps, typeof viewKeys[number]>)
};
export type Props = ExtractPropTypes<typeof props>;
