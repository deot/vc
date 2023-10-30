/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as switchProps } from './switch-props';

const COMPONENT_NAME = 'vc-switch';

export const Switch = defineComponent({
	name: COMPONENT_NAME,
	props: switchProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-switch">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
