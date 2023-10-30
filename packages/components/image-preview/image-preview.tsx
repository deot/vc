/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as imagePreviewProps } from './image-preview-props';

const COMPONENT_NAME = 'vc-image-preview';

export const ImagePreview = defineComponent({
	name: COMPONENT_NAME,
	props: imagePreviewProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-image-preview">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
