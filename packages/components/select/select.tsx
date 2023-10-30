/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as selectProps } from './select-props';

const COMPONENT_NAME = 'vc-select';

export const Select = defineComponent({
	name: COMPONENT_NAME,
	props: selectProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-select">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
