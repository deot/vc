import { defineComponent } from 'vue';
import { props as floatButtonProps } from './float-button-props';
import { useFloatButton } from './use-float-button';

const COMPONENT_NAME = 'vc-float-button';

export const FloatButton = defineComponent({
	name: COMPONENT_NAME,
	inheritAttrs: false,
	props: floatButtonProps,
	emits: ['update:offset', 'after-change', 'click'],
	setup(props, context) {
		return useFloatButton(props, context);
	}
});
