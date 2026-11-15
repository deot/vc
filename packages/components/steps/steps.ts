import { defineComponent } from 'vue';
import { props as stepsProps } from './steps-props';
import { useSteps } from './use-steps';

const COMPONENT_NAME = 'vc-steps';

export const Steps = defineComponent({
	name: COMPONENT_NAME,
	props: stepsProps,
	emits: ['update:modelValue', 'change'],
	setup(props, context) {
		return useSteps(props, context);
	}
});
