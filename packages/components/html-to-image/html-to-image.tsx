/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as htmlToImageProps } from './html-to-image-props';

const COMPONENT_NAME = 'vc-html-to-image';

export const HTMLToImage = defineComponent({
	name: COMPONENT_NAME,
	props: htmlToImageProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-html-to-image">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
