import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import { props as transitionProps } from './transition-props';
import { useTransition } from './use-transition';

const COMPONENT_NAME = 'vc-transition-zoom';

export const TransitionZoom = defineComponent({
	name: COMPONENT_NAME,
	props: {
		...transitionProps,
		mode: {
			type: String as PropType<'x' | 'y' | 'center' | 'none' | string>,
			default: 'x',
			validator: (v: string) => /^(x|y|center|none)$/.test(v)
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
			default: 'vc-transition-zoom'
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
