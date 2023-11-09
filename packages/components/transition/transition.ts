import { defineComponent, h, toHandlers, mergeProps } from 'vue';
import { props as transitionProps } from './transition-props';
import { useTransition } from './use-transition';

const COMPONENT_NAME = 'vc-transition';

export const Transition = defineComponent({
	name: COMPONENT_NAME,
	props: transitionProps,
	// 当不声明emits的情况下，事件存在于attrs中
	inheritAttrs: false,
	setup(props, { slots, attrs }) {
		const { Wrapper, listeners } = useTransition();
		return () => {
			return h(
				Wrapper, 
				mergeProps(
					{
						tag: props.tag,
						enterActiveClass: `${props.prefix} is-in`,
						moveClass: `${props.prefix} is-move`,
						leaveActiveClass: `${props.prefix} is-out`,
					}, 
					attrs, 
					toHandlers(listeners)
				), 
				slots
			);
		};
	}
});
