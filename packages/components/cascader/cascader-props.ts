import type { ExtractPropTypes, PropType } from 'vue';
import { props as selectProps } from '../select/select-props';
import { TreeData } from '../select/utils';
import { expandDirection } from './hooks/use-column-direction';
import type { TreeCheckStrategy } from '../tree/types';

/**
 * v-model 回填路径上的哪些节点，与 TreeSelect 的 checkStrategy 同义
 * 	- all：回填全部选中节点，即完整路径
 * 	- child：只回填最深的选中节点（v-model 是数组时为 [该节点]）；changeOnSelect 时可能是父节点
 */
export type CascaderCheckStrategy = Extract<TreeCheckStrategy, 'all' | 'child'>;

export const props = {
	...selectProps,
	data: {
		type: Array as PropType<TreeData[]>,
		default: () => ([])
	},
	formatter: {
		type: Function,
		default: (v: any[]) => (v && v.join(' / '))
	},
	changeOnSelect: {
		type: Boolean,
		default: false
	},
	// v-model 回填方式，见 CascaderCheckStrategy
	checkStrategy: {
		type: String as PropType<CascaderCheckStrategy>,
		default: 'all',
		validator: (v: any) => ['all', 'child'].includes(v)
	},
	autoWidth: {
		type: Boolean,
		default: true
	},
	// 展开方向，见 use-column-direction
	expandDirection
};
export type Props = ExtractPropTypes<typeof props>;
