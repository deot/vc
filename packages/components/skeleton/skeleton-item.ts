import { defineComponent } from 'vue';
import { props as componentProps } from './skeleton-item-props';
import { useSkeletonItem } from './use-skeleton-item';

const COMPONENT_NAME = 'vc-skeleton-item';

export const SkeletonItem = defineComponent({
	name: COMPONENT_NAME,
	props: componentProps,
	setup(props, context) {
		return useSkeletonItem(props, context);
	}
});
