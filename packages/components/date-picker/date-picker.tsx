/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as datePickerProps } from './date-picker-props';

const COMPONENT_NAME = 'vc-date-picker';

export const DatePicker = defineComponent({
	name: COMPONENT_NAME,
	props: datePickerProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-date-picker">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
