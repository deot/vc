import { inject, provide, getCurrentInstance } from 'vue';
import type { TreeNode } from './store/tree-node';

export const useCollectNode = () => {
	const { props } = getCurrentInstance()!;
	const currentNodeMap: any = {
		treeNodeExpand: (node: TreeNode) => {
			if (props.node && props.node !== node) {
				(props.node as TreeNode).collapse();
			}
		},
		children: []
	};

	const parentNodeMap = inject<any>('vc-tree-node-map', null);

	if (parentNodeMap) {
		parentNodeMap.children.push(currentNodeMap);
	}

	provide('vc-tree-node-map', currentNodeMap);

	return {
		broadcast: (node: TreeNode) => {
			if (!props.accordion) return;
			for (const childNode of currentNodeMap.children) {
				childNode.treeNodeExpand(node);
			}
		},
	};
};
