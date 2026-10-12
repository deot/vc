import type { ExtractPropTypes, PropType } from 'vue';
import { valueType } from '../../customer/customer-props';
import type { CustomerValue } from '../../customer/types';

export type ActionSheetContent = CustomerValue;

export type ActionSheetAction = {
	content?: ActionSheetContent;
	subContent?: ActionSheetContent;
	disabled?: boolean;
	class?: any;
	style?: any;
	onClick?: (action: ActionSheetAction) => any;
};

export type ActionSheetActionValue = ActionSheetAction;

export const props = {
	mask: {
		type: Boolean,
		default: true
	},
	maskClosable: {
		type: Boolean,
		default: true
	},
	wrapperClass: [Object, Array, String],
	wrapperStyle: [Object, Array, String],
	scrollRegExp: {
		type: Object,
		default: () => ({
			className: /(vcm?-popup-scrollable|vcm-action-sheet__actions)/
		})
	},
	title: {
		type: valueType,
		default: ''
	},
	data: {
		type: Array as PropType<ActionSheetAction[]>,
		default: () => []
	},
	cancelText: {
		type: String,
		default: ''
	}
};

export type Props = ExtractPropTypes<typeof props>;
