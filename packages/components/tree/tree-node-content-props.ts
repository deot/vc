import type { ExtractPropTypes, PropType } from 'vue';
import type { TreeNode } from './store/tree-node';
import type { Render } from '../customer/types';

export const props = {
	node: {
		type: Object as PropType<TreeNode>,
		default: () => ({})
	},
	renderNodeLabel: Function as Render,
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
	}
};
export type Props = ExtractPropTypes<typeof props>;
