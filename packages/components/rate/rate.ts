import { defineComponent } from 'vue';
import { props as rateProps } from './rate-props';
import { useRate } from './use-rate';

const COMPONENT_NAME = 'vc-rate';

export const Rate = defineComponent({
	name: COMPONENT_NAME,
	props: rateProps,
	emits: ['update:modelValue', 'change'],
	setup(props, context) {
		return useRate(props, context);
	}
});
