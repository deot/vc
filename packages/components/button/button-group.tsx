import { defineComponent } from 'vue';
import { props as buttonGroupProps } from './button-group-props';
import { useButtonGroup } from './use-button-group';

const COMPONENT_NAME = 'vc-button-group';

export const ButtonGroup = defineComponent({
	name: COMPONENT_NAME,
	props: buttonGroupProps,
	setup(props, context) {
		return useButtonGroup(props, context);
	}
});
