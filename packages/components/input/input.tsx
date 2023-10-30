/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as inputProps } from './input-props';

const COMPONENT_NAME = 'vc-input';

export const Input = defineComponent({
	name: COMPONENT_NAME,
	props: inputProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-input">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
