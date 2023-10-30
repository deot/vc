/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as optionProps } from './option-props';

const COMPONENT_NAME = 'vc-option';

export const Option = defineComponent({
	name: COMPONENT_NAME,
	props: optionProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-option">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
