import { pick } from 'lodash-es';
import type { ExtractPropTypes, PropType } from 'vue';
import { props as selectProps } from '../select/select-props';
import { KEY_VALUE } from './store/constant';
import { props as treeNodeContentProps } from './tree-node-content-props';

const selectKeys = [
	'separator',
	'numerable',
	'nullValue'
] as const;

const treeNodeContentKeys = [
	'renderNodeLabel',
	'renderNodeAfterExpand',
	'showCheckbox',
	'accordion',
	'allowDispatch'
] as const;

export const props = {
	...(pick(selectProps, selectKeys) as Pick<typeof selectProps, typeof selectKeys[number]>),
	...(pick(treeNodeContentProps, treeNodeContentKeys) as Pick<typeof treeNodeContentProps, typeof treeNodeContentKeys[number]>),
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
	indent: {
		type: Number,
		default: 18
	},
	iconClass: String,
	keyValue: {
		type: Object as PropType<typeof KEY_VALUE>,
		default: () => (KEY_VALUE)
	}
};
export type Props = ExtractPropTypes<typeof props>;
