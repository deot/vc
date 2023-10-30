/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as carouselProps } from './carousel-props';

const COMPONENT_NAME = 'vc-carousel';

export const Carousel = defineComponent({
	name: COMPONENT_NAME,
	props: carouselProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-carousel">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
