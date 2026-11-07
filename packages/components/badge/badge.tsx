import { defineComponent } from 'vue';
import { props as badgeProps } from './badge-props';
import { useBadge } from './use-badge';

const COMPONENT_NAME = 'vc-badge';

export const Badge = defineComponent({
	name: COMPONENT_NAME,
	props: badgeProps,
	setup(props, context) {
		return useBadge(props, context, { name: COMPONENT_NAME });
	}
});
