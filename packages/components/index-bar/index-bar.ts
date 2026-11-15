import { defineComponent } from 'vue';
import { props as indexBarProps } from './index-bar-props';
import { useIndexBar } from './use-index-bar';

const COMPONENT_NAME = 'vc-index-bar';

export const IndexBar = defineComponent({
	name: COMPONENT_NAME,
	props: indexBarProps,
	emits: ['update:modelValue', 'change'],
	setup(props, context) {
		return useIndexBar(props, context);
	}
});
