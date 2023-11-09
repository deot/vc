import { defineComponent, h, mergeProps } from 'vue';
import { props as transitionProps } from './transition-props';
import { useTransition } from './use-transition';

const COMPONENT_NAME = 'vc-transition';

export const Transition = defineComponent({
	name: COMPONENT_NAME,
	props: transitionProps,
	// 当不声明emits的情况下，事件存在于attrs中
	inheritAttrs: false,
	setup(props, { slots, attrs }) {
		const { Wrapper, listeners, classes } = useTransition();
		return () => {
			return h(
				Wrapper, 
				mergeProps(
					{
						tag: props.tag
					}, 
					classes.value,
					attrs, 
					listeners
				), 
				slots
			);
		};
	}
});
