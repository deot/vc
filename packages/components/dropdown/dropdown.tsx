/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as dropdownProps } from './dropdown-props';

const COMPONENT_NAME = 'vc-dropdown';

export const Dropdown = defineComponent({
	name: COMPONENT_NAME,
	props: dropdownProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-dropdown">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
