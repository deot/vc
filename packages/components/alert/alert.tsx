import { defineComponent } from 'vue';
import { props as alertProps } from './alert-props';
import { useAlert } from './use-alert';
import { Marquee } from '../marquee';

const COMPONENT_NAME = 'vc-alert';

export const Alert = defineComponent({
	name: COMPONENT_NAME,
	props: alertProps,
	emits: ['close', 'update:modelValue', 'visible-change'],
	setup(props, context) {
		return useAlert(props, context, { Marquee });
	}
});
