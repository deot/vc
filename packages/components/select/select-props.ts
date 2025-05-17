import type { ExtractPropTypes } from 'vue';
import { pick } from 'lodash-es';
import { props as inputProps } from '../input/input-props';
import { props as popoverProps } from '../popover/popover-props';

export const props = {
	...pick(popoverProps, [
		'portalClassName'
	]),
	...pick(inputProps, [
		'elementId',
		'readonly',
		'disabled',
		'modelValue',
		'size',
		'placeholder',
		'clearable'
	]),
	data: {
		type: Array
	},
	searchPlaceholder: {
		type: String,
		default: ''
	},
	trigger: {
		type: String,
		default: 'click'
	},
	tag: {
		type: String,
		default: 'div'
	},
	placement: {
		type: String,
		default: 'bottom-left'
	},
	arrow: {
		type: Boolean,
		default: false
	},
	autoWidth: {
		type: Boolean,
		default: true
	},
	max: {
		type: Number,
		default: 1,
		validator: (v: any) => v >= 1,
	},
	searchable: {
		type: Boolean,
		default: false
	},
	loadData: {
		type: Function,
	},
	extra: {
		type: String,
		default: ''
	}
};
export type Props = ExtractPropTypes<typeof props>;
