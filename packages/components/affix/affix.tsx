import { defineComponent } from 'vue';
import { props as affixProps } from './affix-props';
import { useAffix } from './use-affix';

const COMPONENT_NAME = 'vc-affix';

export const Affix = defineComponent({
	name: COMPONENT_NAME,
	emits: ['update:modelValue'],
	props: affixProps,
	setup(props, context) {
		return useAffix(props, context);
	}
});
