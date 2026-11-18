import { defineComponent } from 'vue';
import { props as marqueeProps } from './marquee-props';
import { useMarquee } from './use-marquee';

const COMPONENT_NAME = 'vc-marquee';

export const Marquee = defineComponent({
	name: COMPONENT_NAME,
	props: marqueeProps,
	emits: ['loop'],
	setup(props, context) {
		return useMarquee(props, context);
	}
});
