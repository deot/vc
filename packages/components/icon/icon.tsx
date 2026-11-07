import { defineComponent } from 'vue';
import { props as iconProps } from './icon-props';
import { useIcon } from './use-icon';

const COMPONENT_NAME = 'vc-icon';

export const Icon = defineComponent({
	name: COMPONENT_NAME,
	props: iconProps,
	setup(props, context) {
		return useIcon(props, context);
	}
});
