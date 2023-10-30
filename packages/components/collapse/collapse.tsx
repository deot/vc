/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as collapseProps } from './collapse-props';

const COMPONENT_NAME = 'vc-collapse';

export const Collapse = defineComponent({
	name: COMPONENT_NAME,
	props: collapseProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-collapse">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
