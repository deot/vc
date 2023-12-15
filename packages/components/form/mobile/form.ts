/** @jsxImportSource vue */

import { defineComponent, h } from 'vue';
import { props as mFormProps } from './form-props';
import { useForm } from '../use-form';
import { MToast } from '../../toast/index.m';

const COMPONENT_NAME = 'vcm-form';

export const MForm = defineComponent({
	name: COMPONENT_NAME,
	props: mFormProps,
	setup(props, { slots, expose }) {
		useForm(expose, {
			throwToast(message: string) {
				MToast.info(message);
			}
		});
		return () => {
			return h(
				props.tag,
				{
					autocomplete: props.autocomplete,
					class: 'vcm-form'
				},
				slots
			);
		};
	}
});
