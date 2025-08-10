import { pick } from 'lodash-es';
import type { ExtractPropTypes, PropType } from 'vue';
import type { Props as CustomerProps } from '../customer/customer-props';
import { props as selectProps } from '../select/select-props';
import { KEY_VALUE } from './model/constant';

const selectKeys = [
	'separator',
	'numerable',
	'nullValue'
] as const;

export const props = {
	...(pick(selectProps, selectKeys) as Pick<typeof selectProps, typeof selectKeys[number]>),
	// 暂不支持，仅作为默认值
	max: {
		type: Number,
		default: Infinity,
		validator: (v: any) => v >= 1,
	},
	// 确保所有value是唯一的; 否则会出现问题
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
	modelValue: [String, Number, Array] as PropType<string | number | any[]>,
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
