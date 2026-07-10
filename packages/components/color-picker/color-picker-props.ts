import type { ExtractPropTypes, PropType } from 'vue';
import { pick } from 'lodash-es';
import { props as popoverProps } from '../popover/popover-props';
import { props as pickerViewProps } from './picker-view-props';

const popoverKeys = [
	'portalClass'
] as const;

export const props = {
	...(pick(popoverProps, popoverKeys) as Pick<typeof popoverProps, typeof popoverKeys[number]>),
	...pickerViewProps,
	disabled: {
		type: Boolean,
		default: false
	},
	trigger: {
		type: String,
		default: 'click'
	},
	arrow: {
		type: Boolean,
		default: false
	},
	size: {
		type: String as PropType<'large' | 'medium' | 'small'>,
		default: 'medium',
		validator: (v: string) => /(large|medium|small)/.test(v)
	},
	editable: {
		type: Boolean,
		default: true
	}
};
export type Props = ExtractPropTypes<typeof props>;
