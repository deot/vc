import type { ExtractPropTypes, PropType } from 'vue';
import type { TreeNode } from './store/tree-node';

// 行只接收节点；显示复选框、自定义标签等树级属性经 inject 从 Tree 读取
export const props = {
	node: {
		type: Object as PropType<TreeNode>,
		required: true as const
	}
};
export type Props = ExtractPropTypes<typeof props>;
