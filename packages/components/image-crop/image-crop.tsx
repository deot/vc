/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as imageCropProps } from './image-crop-props';

const COMPONENT_NAME = 'vc-image-crop';

export const ImageCrop = defineComponent({
	name: COMPONENT_NAME,
	props: imageCropProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-image-crop">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
