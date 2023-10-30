/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as touchProps } from './touch-props';

const COMPONENT_NAME = 'vc-touch';

export const Touch = defineComponent({
	name: COMPONENT_NAME,
	props: touchProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-touch">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
