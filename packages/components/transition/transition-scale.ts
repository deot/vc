import { defineComponent, h, toHandlers, mergeProps, computed } from 'vue';
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
	inheritAttrs: false,
	setup(props, { slots, attrs }) {
		const { Wrapper, its, listeners } = useTransition();
		const classes = computed(() => {
			return props.mode !== 'none' ? `is-${props.mode}` : '';
		});

		return () => {
			return h(
				Wrapper.value, 
				mergeProps(
					{
						tag: props.tag,
						enterActiveClass: `${props.prefix} ${classes.value} is-in`,
						moveClass: `${props.prefix} ${classes.value} is-move`,
						leaveActiveClass: `${props.prefix} ${classes.value} is-out`,
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
