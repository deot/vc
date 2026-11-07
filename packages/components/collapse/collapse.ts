import { defineComponent } from 'vue';
import { props as collapseProps } from './collapse-props';
import { useCollapse } from './use-collapse';

const COMPONENT_NAME = 'vc-collapse';

export const Collapse = defineComponent({
	name: COMPONENT_NAME,
	props: collapseProps,
	emits: ['update:modelValue', 'change'],
	setup(props, context) {
		return useCollapse(props, context);
	}
});
