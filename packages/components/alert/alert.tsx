/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as alertProps } from './alert-props';

const COMPONENT_NAME = 'vc-alert';

export const Alert = defineComponent({
	name: COMPONENT_NAME,
	props: alertProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-alert">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
