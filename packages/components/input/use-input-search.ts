import { ref, watch, getCurrentInstance } from 'vue';
import type { Ref } from 'vue';
import type { Props } from './input-search-props';

type Value = Props['modelValue'];

export const useInputSearch = () => {
	const instance = getCurrentInstance()!;
	const { emit } = instance;
	const props = instance.props as Props;
	const currentValue: Ref<Value> = ref('');

	const isFocus = ref(false);
	/**
	 * 强制必须使用v-model，所以不需要判断一次
	 */
	watch(
		() => props.modelValue,
		(v) => {
			currentValue.value = v;
		},
		{ immediate: false }
	);

	const handleInput = (value: any, e: InputEvent) => {
		emit('input', value, e);
		emit('update:modelValue', value, e);
	};

	const handleFocus = (e: any) => {
		isFocus.value = true;
		if (props.focusEnd) {
			let length = String(currentValue.value).length;
			// hack chrome浏览器的BUG：setSelectionRange() for input/textarea during onFocus fails when mouse clicks
			setTimeout(() => {
				// @ts-ignore
				e.srcElement?.setSelectionRange(length, length);
			}, 0);
		}
		emit('focus', e);
	};

	const handleBlur = (e: InputEvent) => {
		isFocus.value = false;
		emit('blur', e);
	};

	const handleSearch = (e: InputEvent) => {
		emit('enter', e);
	};
	

	const listeners = {
		onKeyup: (e: any) => {
			if (e.keyCode == 13 || e.keyCode == 108) {
				emit('enter', e);
			}
			emit('keyup', e);
		},
		onKeypress: (e: any) => emit('keypress', e),
		onKeydown: (e: any) => emit('keydown', e),
		change: (e: any) => emit('change', e),
		onFocus: handleFocus,
		onBlur: handleBlur,
		onInput: handleInput,
	};

	return {
		isFocus,
		currentValue,
		listeners,
		handleSearch
	};
};