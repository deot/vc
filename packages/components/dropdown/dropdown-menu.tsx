/** @jsxImportSource vue */

import { defineComponent } from 'vue';

const COMPONENT_NAME = 'vc-dropdown-menu';

export const DropdownMenu = defineComponent({
	name: COMPONENT_NAME,
	setup(_, { slots }) {
		return () => {
			return (
				<ul class="vc-dropdown-menu">
					{ slots?.default?.() }
				</ul>

			);
		};
	}
});
