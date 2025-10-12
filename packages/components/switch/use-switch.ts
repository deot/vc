import { inject, getCurrentInstance, ref, watch, computed } from 'vue';
import type { SetupContext } from 'vue';

export const useSwitch = (expose: SetupContext['expose']) => {
	const instance = getCurrentInstance()!;
	const formItem = inject<any>('vc-form-item', {});

	const { props, emit } = instance;

	const currentValue = ref<any>('');
	const isLoading = ref(false);

	const checked = computed(() => {
		return currentValue.value === props.checkedValue;
	});

	const classes = computed(() => {
		return {
			'is-disabled': props.disabled,
			'is-loading': isLoading.value,
			'is-checked': checked.value
		};
	});

	watch(
		() => props.modelValue,
		(v) => {
			currentValue.value = v;
		},
		{ immediate: true }
	);

	const reset = (value: any) => {
		currentValue.value = value === props.checkedValue
			? props.checkedValue
			: props.uncheckedValue;
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

	const handleToggle = (e) => {
		e.preventDefault();

		if (props.disabled || isLoading.value) {
			return false;
		}

		const callback = () => {
			const value = currentValue.value === props.checkedValue
				? props.uncheckedValue
				: props.checkedValue;

			reset(value);
			sync(e);
		};

		const { onClick } = instance.vnode.props || {};
		const fn = onClick && onClick(e, reset);

		if (fn && fn.then) {
			isLoading.value = true;
			fn.then((res: any) => {
				callback();
				return res;
			}).finally(() => {
				isLoading.value = false;
			});
		} else if (!fn) {
			callback();
		}
	};

	expose({ reset });
	return {
		currentValue,
		isLoading,
		classes,
		checked,
		handleToggle,
		sync,
		reset
	};
};
