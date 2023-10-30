/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as transitionProps } from './transition-props';

const COMPONENT_NAME = 'vc-transition';

export const Transition = defineComponent({
	name: COMPONENT_NAME,
	props: transitionProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-transition">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
