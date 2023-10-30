/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as imageProcessingProps } from './image-processing-props';

const COMPONENT_NAME = 'vc-image-processing';

export const ImageProcessing = defineComponent({
	name: COMPONENT_NAME,
	props: imageProcessingProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-image-processing">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
