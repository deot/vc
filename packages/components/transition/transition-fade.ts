import { defineComponent, h } from 'vue';
import { props as transitionProps } from './transition-props';
import { useTransition } from './use-transition';

const COMPONENT_NAME = 'vc-transition-fade';

export const TransitionFade = defineComponent({
	name: COMPONENT_NAME,
	props: {
		...transitionProps,
		styles: {
			type: Object,
			default: () => ({
				animationFillMode: 'both',
				animationTimingFunction: undefined,
			})
		},
		prefix: {
			type: String,
			default: 'vc-transition-fade'
		}
	},
	// 当不声明emits的情况下，事件存在于attrs中
	inheritAttrs: false,
	setup(props, { slots, attrs }) {
		const { Wrapper, listeners, classes } = useTransition();
		return () => {
			return h(
				Wrapper.value, 
				{
					...attrs,
					...listeners,
					...classes.value,
					tag: props.tag
				},  
				slots
			);
		};
	}
});
