import { provide, inject, getCurrentInstance, ref, watch } from 'vue';
import { isEqualWith } from 'lodash';

export const useCheckboxGroup = () => {
	const { props, emit } = getCurrentInstance()!;
	const formItem = inject<any>('vc-form-item', {});

	const currentValue = ref<any>([]);

	watch(
		() => props.modelValue,
		(v) => {
			if (isEqualWith(v, currentValue.value)) {
				return;
			}
			currentValue.value = v;
		},
		{ immediate: true }
	);

	const reset = (v: any) => {
		const index = currentValue.value.findIndex(i => i == v);
		index == -1
			? currentValue.value.push(v)
			: currentValue.value.splice(index, 1);
	};

	/**
	 * v-model 同步, 外部的数据改变时不会触发
	 * @param e ~
	 */
	const sync = (e: any) => {
		emit('update:modelValue', currentValue.value, e, reset);
		emit('change', currentValue.value, e, reset);

		formItem?.change?.(currentValue.value);
	};

	provide('vc-checkbox-group', {
		props,
		currentValue,
		reset,
		sync
	});

	return {
		currentValue,
		sync,
		reset
	};
};
