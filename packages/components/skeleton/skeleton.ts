import { defineComponent } from 'vue';
import { props as componentProps } from './skeleton-props';
import { useSkeleton } from './use-skeleton';

const COMPONENT_NAME = 'vc-skeleton';

export const Skeleton = defineComponent({
	name: COMPONENT_NAME,
	props: componentProps,
	setup(props, context) {
		return useSkeleton(props, context);
	}
});
