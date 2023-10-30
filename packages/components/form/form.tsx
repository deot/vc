/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as formProps } from './form-props';

const COMPONENT_NAME = 'vc-form';

export const Form = defineComponent({
	name: COMPONENT_NAME,
	props: formProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-form">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
