import { defineComponent } from 'vue';
import { props as dividerProps } from './divider-props';
import { useDivider } from './use-divider';

const COMPONENT_NAME = 'vc-divider';

export const Divider = defineComponent({
	name: COMPONENT_NAME,
	props: dividerProps,
	setup(props, context) {
		return useDivider(props, context);
	}
});
