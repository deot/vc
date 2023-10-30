/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as popupProps } from './popup-props';

const COMPONENT_NAME = 'vc-popup';

export const Popup = defineComponent({
	name: COMPONENT_NAME,
	props: popupProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-popup">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
