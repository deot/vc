/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as fragmentProps } from './fragment-props';

const COMPONENT_NAME = 'vc-fragment';

export const Fragment = defineComponent({
	name: COMPONENT_NAME,
	props: fragmentProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-fragment">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
