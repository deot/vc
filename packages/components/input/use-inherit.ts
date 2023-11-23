import { computed, getCurrentInstance } from 'vue';
import type { Props } from './input-props'; 

export const useInherit = () => {
	const instance = getCurrentInstance()!;
	const props = instance.props as Props;

	const binds = computed(() => {
		return {
			id: props.elementId,
			autocomplete: props.autocomplete,
			spellcheck: props.spellcheck,
			type: props.type,
			placeholder: props.placeholder,
			disabled: props.disabled,
			maxlength: props.maxlength,
			readonly: props.readonly,
			name: props.name,
			autofocus: props.autofocus,
			focusEnd: props.focusEnd
		};
	});

	return {
		binds,
	};
};