/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as imageProps } from './image-props';

const COMPONENT_NAME = 'vc-image';

export const Image = defineComponent({
	name: COMPONENT_NAME,
	props: imageProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-image">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
