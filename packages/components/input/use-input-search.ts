import { ref, watch, getCurrentInstance } from 'vue';
import type { Ref } from 'vue';
import type { Props } from './input-search-props';

type Value = Props['modelValue'];

export const useInputSearch = () => {
	const instance = getCurrentInstance()!;
	const { emit } = instance;
	const props = instance.props as Props;
	const currentValue: Ref<Value> = ref('');

	watch(
		() => props.modelValue,
		(v) => {
			currentValue.value = v;
		},
		{ immediate: true }
	);

	const handleSearch = (e: InputEvent) => {
		emit('enter', e);
	};

	return {
		currentValue,
		handleSearch
	};
};