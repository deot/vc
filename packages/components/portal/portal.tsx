/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as portalProps } from './portal-props';

const COMPONENT_NAME = 'vc-portal';

export const Portal = defineComponent({
	name: COMPONENT_NAME,
	props: portalProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-portal">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
