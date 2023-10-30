/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as uploadProps } from './upload-props';

const COMPONENT_NAME = 'vc-upload';

export const Upload = defineComponent({
	name: COMPONENT_NAME,
	props: uploadProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-upload">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
