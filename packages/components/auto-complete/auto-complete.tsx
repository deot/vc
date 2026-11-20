import { defineComponent } from 'vue';
import { props as autoCompleteProps } from './auto-complete-props';
import { useAutoComplete, emits } from './use-auto-complete';

const COMPONENT_NAME = 'vc-auto-complete';

export const AutoComplete = defineComponent({
	name: COMPONENT_NAME,
	inheritAttrs: false,
	props: autoCompleteProps,
	emits: [...emits],
	setup(props, context) {
		return useAutoComplete(props, context);
	}
});
