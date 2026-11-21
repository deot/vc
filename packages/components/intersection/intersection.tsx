import { defineComponent } from 'vue';
import { props as intersectionProps } from './intersection-props';
import { useIntersection } from './use-intersection';

const COMPONENT_NAME = 'vc-intersection';

export const Intersection = defineComponent({
	name: COMPONENT_NAME,
	props: intersectionProps,
	emits: ['update:modelValue', 'change'],
	setup(props, context) {
		return useIntersection(props, context);
	}
});
