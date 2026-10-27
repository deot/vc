import { pick } from 'lodash-es';
import type { ExtractPropTypes, PropType } from 'vue';
import { props as selectProps } from '../select/select-props';
import { KEY_VALUE } from './store/constant';
import type { TreeAllowDragPayload, TreeAllowDropPayload, TreeCheckStrategy } from './types';
import { renderType, valueType } from '../customer/customer-props';

const selectKeys = [
	'separator',
	'numerable',
	'nullValue',
	// 只渲染视口附近的行（RecycleList），沿用所在的滚动容器（外层 Scroller、浮层或页面）
	'virtualized'
] as const;

export const props = {
	...(pick(selectProps, selectKeys) as Pick<typeof selectProps, typeof selectKeys[number]>),
	renderNodeLabel: renderType,
	// 已废弃：铺平渲染后不再区分，保留以兼容
	renderNodeAfterExpand: {
		type: Boolean,
		default: true
	},
	showCheckbox: {
		type: Boolean,
		default: false
	},
	accordion: {
		type: Boolean,
		default: false
	},
	allowDispatch: {
		type: Boolean,
		default: true
	},
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
		type: valueType,
		default: undefined
	},
	// 勾选联动与 v-model 回填方式，见 TreeCheckStrategy
	checkStrategy: {
		type: String as PropType<TreeCheckStrategy>,
		default: 'all'
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
	// 节点能否被拖动
	allowDrag: Function as PropType<(data: TreeAllowDragPayload) => boolean>,
	// 能否放到目标节点的某个区域（before / inner / after 分别询问）
	allowDrop: Function as PropType<(data: TreeAllowDropPayload) => boolean>,
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
		type: Object as PropType<Partial<typeof KEY_VALUE>>,
		default: () => (KEY_VALUE)
	}
};
export type Props = ExtractPropTypes<typeof props>;
