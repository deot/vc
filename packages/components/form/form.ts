/** @jsxImportSource vue */

import { defineComponent, h } from 'vue';
import { props as formProps } from './form-props';
import { useForm } from './use-form';

const COMPONENT_NAME = 'vc-form';

export const Form = defineComponent({
	name: COMPONENT_NAME,
	props: formProps,
	setup(props, { slots, expose }) {
		useForm(expose);
		return () => {
			return h(
				props.tag,
				{
					class: 'vc-form',
					autocomplete: props.autocomplete,
				},
				slots
			);
		};
	}
});
