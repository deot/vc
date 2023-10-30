/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as modalProps } from './modal-props';

const COMPONENT_NAME = 'vc-modal';

export const Modal = defineComponent({
	name: COMPONENT_NAME,
	props: modalProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-modal">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
