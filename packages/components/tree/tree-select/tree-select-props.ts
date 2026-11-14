import type { ExtractPropTypes } from 'vue';
import { pick } from 'lodash-es';
import { props as selectProps } from '../../select/select-props';
import { expandDirection } from '../../cascader/hooks/use-column-direction';
import { props as treeProps } from '../tree-props';

const treeKeys = [
	'checkStrategy',
	'data',
	'max',
	'renderNodeLabel'
] as const;

export const props = {
	...selectProps,
	...(pick(treeProps, treeKeys) as Pick<typeof treeProps, typeof treeKeys[number]>),
	// 同 Select：1 为单选（点节点选中并关闭，没有复选框）；大于 1 为多选，最多 max 项；0 为不限
	max: {
		...treeProps.max,
		default: 1
	},
	autoWidth: {
		type: Boolean,
		default: void 0
	},
	/**
	 * 级联列模式：与 Cascader 相同的 hover 展开下一级，勾选逻辑与树形模式一致
	 */
	cascader: {
		type: Boolean,
		default: false
	},
	// 级联列的展开方向（仅级联模式），见 use-column-direction
	expandDirection
};
export type Props = ExtractPropTypes<typeof props>;
