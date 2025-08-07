import type { ExtractPropTypes, PropType } from 'vue';
import { pick } from 'lodash-es';
import type { TreeNode } from './model/tree-node';
import { props as treeProps } from './tree-props';

const treeKeys = [
	'render',
	'renderAfterExpand',
	'showCheckbox',
	'accordion',
	'allowDispatch'
] as const;

export const props = {
	...(pick(treeProps, treeKeys) as Pick<typeof treeProps, typeof treeKeys[number]>),
	node: {
		type: Object as PropType<TreeNode>,
		default: () => ({})
	},
};
export type Props = ExtractPropTypes<typeof props>;
