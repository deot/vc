import { provide, inject, getCurrentInstance, ref, watch, computed } from 'vue';
import { isEqualWith } from 'lodash-es';

export const useRadioGroup = () => {
	const { props, emit } = getCurrentInstance()!;
	const formItem = inject<any>('vc-form-item', {});

	const currentValue = ref<any>('');
	const classes = computed(() => {
		return {
			'is-vertical': props.vertical,
			'is-button': props.type === 'button'
		};
	});

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
		currentValue.value = v;
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

	provide('vc-radio-group', {
		props,
		currentValue,
		reset,
		sync
	});

	return {
		currentValue,
		classes,
		sync,
		reset
	};
};
