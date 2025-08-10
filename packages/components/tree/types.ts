import type { ComponentInternalInstance, Ref } from 'vue';
import type { Props } from './tree-props';
import type { TreeStore, TreeNode } from './store';

export interface TreeProvide {
	props: Props;
	store: TreeStore;
	root: TreeNode;
	currentNodeInstance: Ref<ComponentInternalInstance>;
	instance: ComponentInternalInstance;
	drag: any;
	emit: any;
};
