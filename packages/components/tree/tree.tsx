import { defineComponent } from 'vue';
import { props as treeProps, emits as treeEmits } from './tree-props';
import { useTree } from './use-tree';

const COMPONENT_NAME = 'vc-tree';

export const Tree = defineComponent({
	name: COMPONENT_NAME,
	props: treeProps,
	emits: [...treeEmits],
	setup(props, context) {
		return useTree(props, context);
	}
});
