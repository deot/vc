import type { ExtractPropTypes, PropType } from 'vue';
import type { Props as CustomerProps } from '../customer/customer-props';
import { KEY_VALUE } from './model/constant';

export const props = {
	data: {
		type: Array,
		default: () => ([])
	},
	emptyText: {
		type: String,
		default: '暂无数据'
	},
	renderAfterExpand: {
		type: Boolean,
		default: true
	},
	checkStrictly: {
		type: Boolean,
		default: false
	},
	defaultExpandAll: Boolean,
	expandOnClickNode: {
		type: Boolean,
		default: true
	},
	checkOnClickNode: Boolean,
	checkDescendants: {
		type: Boolean,
		default: false
	},
	autoExpandParent: {
		type: Boolean,
		default: true
	},
	// checkedValues -> modelValue
	modelValue: {
		type: Array as PropType<(string | number)[]>,
		default: () => ([])
	},
	// Value[]
	expandedValues: {
		type: Array as PropType<(string | number)[]>,
		default: () => ([])
	},
	currentNodeValue: [String, Number],
	render: Function as PropType<CustomerProps['render']>,
	showCheckbox: {
		type: Boolean,
		default: false
	},
	draggable: {
		type: Boolean,
		default: false
	},
	allowDrag: Function,
	allowDrop: Function,
	lazy: {
		type: Boolean,
		default: false
	},
	highlightCurrent: Boolean,
	loadData: Function,
	filterNode: Function,
	accordion: {
		type: Boolean,
		default: false
	},
	indent: {
		type: Number,
		default: 18
	},
	iconClass: String,
	keyValue: {
		type: Object as PropType<typeof KEY_VALUE>,
		default: () => (KEY_VALUE)
	},
	allowDispatch: {
		type: Boolean,
		default: true
	}
};
export type Props = ExtractPropTypes<typeof props>;
