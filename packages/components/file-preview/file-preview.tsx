/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as filePreviewProps } from './file-preview-props';

const COMPONENT_NAME = 'vc-file-preview';

export const FilePreview = defineComponent({
	name: COMPONENT_NAME,
	props: filePreviewProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-file-preview">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
