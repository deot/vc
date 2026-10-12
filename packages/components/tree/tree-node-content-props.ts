import type { ExtractPropTypes, PropType } from 'vue';
import type { TreeNode } from './store/tree-node';
import { renderType } from '../customer/customer-props';

export const props = {
	node: {
		type: Object as PropType<TreeNode>,
		default: () => ({})
	},
	renderNodeLabel: renderType,
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
