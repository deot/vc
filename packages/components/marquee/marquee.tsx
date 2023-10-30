/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as marqueeProps } from './marquee-props';

const COMPONENT_NAME = 'vc-marquee';

export const Marquee = defineComponent({
	name: COMPONENT_NAME,
	props: marqueeProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-marquee">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
