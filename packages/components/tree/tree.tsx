/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as treeProps } from './tree-props';

const COMPONENT_NAME = 'vc-tree';

export const Tree = defineComponent({
	name: COMPONENT_NAME,
	props: treeProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-tree">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
