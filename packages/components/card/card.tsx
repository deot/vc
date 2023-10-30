/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as cardProps } from './card-props';

const COMPONENT_NAME = 'vc-card';

export const Card = defineComponent({
	name: COMPONENT_NAME,
	props: cardProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-card">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
