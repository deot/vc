/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as colorPickerProps } from './color-picker-props';

const COMPONENT_NAME = 'vc-color-picker';

export const ColorPicker = defineComponent({
	name: COMPONENT_NAME,
	props: colorPickerProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-color-picker">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
