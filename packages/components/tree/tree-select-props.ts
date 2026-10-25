import type { ExtractPropTypes } from 'vue';
import { pick } from 'lodash-es';
import { props as selectProps } from '../select/select-props';
import { expandDirection } from '../cascader/hooks/use-column-direction';
import { props as treeProps } from './tree-props';

const treeKeys = [
	'checkStrictly',
	'data',
	'max',
	'renderNodeLabel'
] as const;

export const props = {
	...selectProps,
	...(pick(treeProps, treeKeys) as Pick<typeof treeProps, typeof treeKeys[number]>),
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
