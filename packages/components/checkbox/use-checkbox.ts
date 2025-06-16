import { inject, getCurrentInstance, ref, watch, computed } from 'vue';

export const useCheckbox = () => {
	const { props, emit } = getCurrentInstance()!;
	const group = inject<any>('vc-checkbox-group', {});
	const formItem = inject<any>('vc-form-item', {});

	const currentValue = ref<any>(undefined);
	const isFocus = ref(false);

	const hasGroup = computed(() => {
		return !!group.props;
	});

	// 优先找value和label都有值，value用于选择，label用于展示
	const computedValue = computed(() => {
		return typeof props.value === 'undefined' || props.value === ''
			? props.label
			: props.value;
	});

	const computedLabel = computed(() => {
		return typeof props.label === 'undefined' || props.label === ''
			? props.value
			: props.label;
	});

	const checked = computed(() => {
		return hasGroup.value
			? group.currentValue.value.includes(computedValue.value)
			: currentValue.value === props.checkedValue;
	});

	const classes = computed(() => {
		return {
			'is-indeterminate': props.indeterminate,
			'is-checked': checked.value,
			'is-disabled': props.disabled,
			'is-focus': isFocus.value,
			'is-error': !!formItem?.message?.value
		};
	});

	watch(
		() => props.modelValue,
		(v) => {
			currentValue.value = v;
		},
		{ immediate: true }
	);

	const reset = ($checked: any) => {
		currentValue.value = $checked ? props.checkedValue : props.uncheckedValue;
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

	const handleChange = (e: any) => {
		if (props.disabled) {
			return false;
		}
		const $checked = e.target.checked;

		if (hasGroup.value) {
			group.reset(computedValue.value);
			group.sync(e);
		} else {
			reset($checked);
			sync(e);
		}
	};

	const handleBlur = () => {
		isFocus.value = false;
	};

	const handleFocus = () => {
		isFocus.value = true;
	};

	return {
		currentValue,
		isFocus,
		classes,
		hasGroup,
		checked,
		handleChange,
		handleBlur,
		handleFocus,
		sync,
		reset,
		computedValue,
		computedLabel
	};
};
