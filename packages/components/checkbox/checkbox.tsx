/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as checkboxProps } from './checkbox-props';

const COMPONENT_NAME = 'vc-checkbox';

export const Checkbox = defineComponent({
	name: COMPONENT_NAME,
	props: checkboxProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-checkbox">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
