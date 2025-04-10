import { defineComponent, h } from 'vue';
import { props as transitionProps } from './transition-props';
import { useTransition } from './use-transition';

const COMPONENT_NAME = 'vc-transition-slide';

export const TransitionSlide = defineComponent({
	name: COMPONENT_NAME,
	props: {
		...transitionProps,
		mode: {
			type: String,
			default: 'left',
			validator: (v: string) => /^(left|right|down|up|none)(|-part)$/.test(v)
		},
		// inheritAttrs必须是false
		style: {
			type: Object,
			default: () => ({
				animationFillMode: 'both',
				animationTimingFunction: undefined,
			})
		},
		prefix: {
			type: String,
			default: 'vc-transition-slide'
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
