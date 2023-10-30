/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as sliderProps } from './slider-props';

const COMPONENT_NAME = 'vc-slider';

export const Slider = defineComponent({
	name: COMPONENT_NAME,
	props: sliderProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-slider">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
