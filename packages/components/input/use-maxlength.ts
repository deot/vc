import { ref, watch, getCurrentInstance } from 'vue';
import type { Ref } from 'vue';
import type { Props } from './input-props'; 
import { isPassByMaxlength, getBytesLength } from './utils';

export const useMaxlength = (currentValue: Ref<string | number | any[]>) => {
	const instance = getCurrentInstance()!;

	const { emit } = instance;
	const props = instance.props as Props;

	const currentMaxlength = ref(props.maxlength);

	// 输入框内容允许输入的长度
	const getMaxLength = (value: number | string) => {
		if (!props.bytes || !props.maxlength) return props.maxlength;
		let extraLength = getBytesLength(value);
		return props.maxlength + extraLength;
	};

	const handlePaste = (e: ClipboardEvent) => {
		// 只有在bytes下,会需要重新计算maxlength
		if (props.bytes) {
			let content = currentValue.value + (e.clipboardData as DataTransfer).getData('text');
			if (!isPassByMaxlength(content, props.maxlength)) { e.preventDefault(); }
			currentMaxlength.value = getMaxLength(content);
		}

		emit('paste', e);
	};

	watch(
		() => props.modelValue,
		(v) => {
			if (Array.isArray(v)) return;
			currentMaxlength.value = getMaxLength(v);
		},
		{ immediate: false }
	);

	watch(
		() => props.maxlength,
		(v) => {
			if (!v || !props.bytes) {
				currentMaxlength.value = v;
			} else {
				let extraLength = getBytesLength(currentValue.value);
				currentMaxlength.value = v + extraLength;
			}
		},
		{ immediate: false }
	);

	return {
		currentMaxlength,
		handlePaste
	};
};