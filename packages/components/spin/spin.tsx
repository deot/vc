import { defineComponent } from 'vue';
import { props as spinProps } from './spin-props';
import { useSpin } from './use-spin';

const COMPONENT_NAME = 'vc-spin';

export const Spin = defineComponent({
	name: COMPONENT_NAME,
	props: spinProps,
	setup(props, context) {
		return useSpin(props, context);
	}
});
