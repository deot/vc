import type { ExtractPropTypes } from 'vue';
import { pick } from 'lodash-es';
import { props as inputProps } from '../../input/input-props';
import { props as popoverProps } from '../../popover/popover-props';

const inputKeys = [
	'id',
	'disabled'
] as const;

const popoverKeys = [
	'portal',
	'portalClass'
] as const;

export const props = {
	...(pick(popoverProps, popoverKeys) as Pick<typeof popoverProps, typeof popoverKeys[number]>),
	...(pick(inputProps, inputKeys) as Pick<typeof inputProps, typeof inputKeys[number]>),
	type: String,
	placeholder: String,
	clearable: {
		type: Boolean,
		default: true
	},
	modelValue: [Date, Array, String],
	multiple: Boolean,
	open: Boolean,
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
	confirm: {
		type: Boolean,
		default: false
	},
	format: String,
	separator: {
		type: String,
		default: ' - '
	},
	startDate: {
		type: Date
	},
	splitPanels: {
		type: Boolean,
		default: true
	},
	steps: {
		type: Array,
		default: () => ([])
	},
	// 选择即触发change
	changeOnSelect: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;
