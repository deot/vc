import { defineComponent } from 'vue';
import { props as cardProps } from './card-props';
import { useCard } from './use-card';

const COMPONENT_NAME = 'vc-card';

export const Card = defineComponent({
	name: COMPONENT_NAME,
	props: cardProps,
	setup(props, context) {
		return useCard(props, context);
	}
});
