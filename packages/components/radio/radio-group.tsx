import { defineComponent } from 'vue';
import { props as radioGroupProps } from './radio-group-props';
import { useRadioGroup } from './use-radio-group';

const COMPONENT_NAME = 'vc-radio-group';

export const RadioGroup = defineComponent({
	name: COMPONENT_NAME,
	props: radioGroupProps,
	emits: ['update:modelValue', 'change'],
	setup(props, context) {
		return useRadioGroup(props, context, { name: COMPONENT_NAME });
	}
});
