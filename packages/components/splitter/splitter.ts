import { defineComponent } from 'vue';
import { props as splitterProps } from './splitter-props';
import { useSplitter } from './use-splitter';

const COMPONENT_NAME = 'vc-splitter';

export const Splitter = defineComponent({
	name: COMPONENT_NAME,
	props: splitterProps,
	emits: ['resize-start', 'resize', 'resize-end', 'collapse-change'],
	setup(props, context) {
		return useSplitter(props, context);
	}
});
