/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as uploadPickerProps } from './upload-picker-props';

const COMPONENT_NAME = 'vc-upload-picker';

export const UploadPicker = defineComponent({
	name: COMPONENT_NAME,
	props: uploadPickerProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-upload-picker">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
