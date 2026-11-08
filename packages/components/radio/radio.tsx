import { defineComponent } from 'vue';
import { props as radioProps } from './radio-props';
import { useRadio } from './use-radio';

const COMPONENT_NAME = 'vc-radio';

export const Radio = defineComponent({
	name: COMPONENT_NAME,
	props: radioProps,
	emits: ['update:modelValue', 'change'],
	setup(props, context) {
		return useRadio(props, context, { name: COMPONENT_NAME });
	}
});
