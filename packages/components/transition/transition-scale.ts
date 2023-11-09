import { defineComponent, h, mergeProps } from 'vue';
import type { PropType } from 'vue';
import { props as transitionProps } from './transition-props';
import { useTransition } from './use-transition';

const COMPONENT_NAME = 'vc-transition-scale';

export const TransitionScale = defineComponent({
	name: COMPONENT_NAME,
	props: {
		...transitionProps,
		mode: {
			type: String as PropType<'x' | 'y' | 'part' | 'both' | 'none'>,
			default: 'both',
			validator: (v: string) => /(part|both|y|x|none)/.test(v)
		},
		styles: {
			type: Object,
			default: () => ({
				animationFillMode: 'both',
				animationTimingFunction: undefined,
			})
		},
		prefix: {
			type: String,
			default: 'vc-transition-scale'
		}
	},
	// 当不声明emits的情况下，事件存在于attrs中
	inheritAttrs: false,
	setup(props, { slots, attrs }) {
		const { Wrapper, listeners, classes } = useTransition();

		return () => {
			return h(
				Wrapper.value, 
				mergeProps(
					{
						tag: props.tag,
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
