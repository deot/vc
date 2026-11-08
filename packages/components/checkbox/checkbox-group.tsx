import { defineComponent } from 'vue';
import { props as checkboxGroupProps } from './checkbox-group-props';
import { useCheckboxGroup } from './use-checkbox-group';

const COMPONENT_NAME = 'vc-checkbox-group';

export const CheckboxGroup = defineComponent({
	name: COMPONENT_NAME,
	props: checkboxGroupProps,
	emits: ['update:modelValue', 'change'],
	setup(props, context) {
		return useCheckboxGroup(props, context, { name: COMPONENT_NAME });
	}
});
