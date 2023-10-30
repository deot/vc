/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as timePickerProps } from './time-picker-props';

const COMPONENT_NAME = 'vc-time-picker';

export const TimePicker = defineComponent({
	name: COMPONENT_NAME,
	props: timePickerProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-time-picker">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
