import { defineComponent } from 'vue';
import { props as checkboxProps } from './checkbox-props';
import { useCheckbox } from './use-checkbox';

const COMPONENT_NAME = 'vc-checkbox';

export const Checkbox = defineComponent({
	name: COMPONENT_NAME,
	props: checkboxProps,
	emits: ['update:modelValue', 'change'],
	setup(props, context) {
		return useCheckbox(props, context, { name: COMPONENT_NAME, shape: 'square' });
	}
});
