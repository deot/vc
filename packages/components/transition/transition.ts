import { defineComponent, h, toHandlers, mergeProps } from 'vue';
import { props as transitionProps } from './transition-props';
import { useTransition } from './use-transition';

const COMPONENT_NAME = 'vc-transition';

export const Transition = defineComponent({
	name: COMPONENT_NAME,
	props: transitionProps,
	inheritAttrs: false,
	setup(props, { slots, attrs }) {
		const { Wrapper, its, listeners } = useTransition();
		return () => {
			return h(
				Wrapper, 
				mergeProps(
					{
						tag: props.tag,
						enterActiveClass: `${props.prefix} is-in`,
						moveClass: `${props.prefix} is-move`,
						leaveActiveClass: `${props.prefix} is-out`,
						style: its.value.style,
						class: its.value.class,
					}, 
					attrs, 
					toHandlers(listeners)
				), 
				slots
			);
		};
	}
});
