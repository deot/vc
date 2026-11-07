import { defineComponent } from 'vue';
import { props as buttonProps } from './button-props';
import { useButton } from './use-button';

const COMPONENT_NAME = 'vc-button';

export const Button = defineComponent({
	name: COMPONENT_NAME,
	emits: ['click'],
	props: buttonProps,
	setup(props, context) {
		return useButton(props, context);
	}
});
