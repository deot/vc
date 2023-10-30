/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as toastProps } from './toast-props';

const COMPONENT_NAME = 'vc-toast';

export const Toast = defineComponent({
	name: COMPONENT_NAME,
	props: toastProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-toast">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
