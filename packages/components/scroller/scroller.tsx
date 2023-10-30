/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as scrollerProps } from './scroller-props';

const COMPONENT_NAME = 'vc-scroller';

export const Scroller = defineComponent({
	name: COMPONENT_NAME,
	props: scrollerProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-scroller">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
