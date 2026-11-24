import { defineComponent } from 'vue';
import { props as backTopProps } from './back-top-props';
import { useBackTop } from './use-back-top';

const COMPONENT_NAME = 'vc-back-top';

export const BackTop = defineComponent({
	name: COMPONENT_NAME,
	inheritAttrs: false,
	props: backTopProps,
	emits: ['update:modelValue', 'click'],
	setup(props, context) {
		return useBackTop(props, context);
	}
});
