/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as pickerProps } from './picker-props';

const COMPONENT_NAME = 'vc-picker';

export const Picker = defineComponent({
	name: COMPONENT_NAME,
	props: pickerProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-picker">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
